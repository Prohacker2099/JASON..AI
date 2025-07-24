import os
import subprocess
import requests
import threading
import time
import re
import json
import socket
import sys
from http.server import SimpleHTTPRequestHandler
from socketserver import TCPServer
from pathlib import Path
from datetime import datetime
import atexit
import stat
import shutil
import http.client
import urllib.parse
import glob
import logging # Import the logging module
import random # For jitter in exponential backoff

# Configure logging
logging.basicConfig(
    level=logging.DEBUG, # Set the logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout), # Log to console
        logging.FileHandler("logs/jason_visioneer.log", encoding="utf8") # Log to file
    ],
    force=True # Force basicConfig to reconfigure if it's already been called
)

# Register atexit hooks for final flushing
atexit.register(lambda: logging.shutdown()) # Ensure all logs are flushed on exit

logging.info("Script started.")
logging.info("Initializing global variables and directories...")

def copy_directory(src: Path, dst: Path, max_retries=5, delay_seconds=5):
    """Copies contents of src directory to dst directory with retries."""
    for i in range(max_retries):
        try:
            if dst.exists():
                cleanup_directory(dst) # Use cleanup_directory for robustness
            # Exclude .venv directory during copy
            # Define patterns to ignore during the copy operation
            # This is crucial to prevent recursive copying of temp_test_run
            ignore_patterns = shutil.ignore_patterns('.venv', 'temp_test_run', 'test_combinations', 'logs') # Also ignore logs to prevent copying large log files

            shutil.copytree(src, dst, ignore=ignore_patterns)
            print(f"Copied {src.relative_to(ROOT)} to {dst.relative_to(ROOT)}")
            return
        except Exception as e:
            print(f"Error copying {src.relative_to(ROOT)} to {dst.relative_to(ROOT)} (attempt {i+1}/{max_retries}). Retrying in {delay_seconds}s. Error: {e}")
            time.sleep(delay_seconds)
    print(f"Failed to copy {src.relative_to(ROOT)} after {max_retries} attempts.")
    raise Exception(f"Failed to copy directory {src} to {dst} after multiple attempts.")

def cleanup_directory(path: Path, max_retries=10, delay_seconds=1):
    """
    Removes a directory if it exists, with robust handling for PermissionError,
    OSError (including "Directory not empty" and "Filename too long"),
    and nested Git repositories. Employs retry mechanisms with exponential backoff.
    """
    normalized_path = Path(os.path.normpath(path))
    log_dir = Path("logs")
    log_dir.mkdir(parents=True, exist_ok=True)

    if not normalized_path.exists():
        logging.info(f"Directory {normalized_path.relative_to(ROOT)} does not exist. No cleanup needed.")
        return

    logging.info(f"Attempting to clean up directory: {normalized_path.relative_to(ROOT)}")

    for i in range(max_retries):
        try:
            # Use a custom onerror handler for shutil.rmtree
            def onerror(func, path_in_error, exc_info):
                """
                Error handler for shutil.rmtree. Attempts to change file permissions
                and retry the operation.
                """
                error_type = exc_info[0].__name__
                error_message = str(exc_info[1])
                logging.debug(f"onerror caught {error_type} for {path_in_error}: {error_message}")
                
                # Log the specific error that occurred with traceback
                logging.exception(f"onerror caught {error_type} for {path_in_error}: {error_message}")
                
                if isinstance(exc_info[1], PermissionError):
                    logging.warning(f"PermissionError encountered for {path_in_error}. Attempting to modify permissions and retry.")
                    try:
                        # On POSIX, change permissions to allow write access
                        if sys.platform != "win32":
                            os.chmod(path_in_error, stat.S_IWRITE)
                            logging.debug(f"Changed permissions for {path_in_error} to writable on POSIX.")
                        # On Windows, try icacls for more robust permission changes and attrib -R
                        else:
                            logging.debug(f"Attempting icacls and attrib -R for {path_in_error}")
                            # Grant full control to 'Everyone'
                            icacls_command = ["icacls", str(path_in_error), "/grant:r", "Everyone:(F)", "/c", "/t", "/q"]
                            icacls_result = subprocess.run(icacls_command, check=False, capture_output=True, text=True)
                            if icacls_result.returncode != 0:
                                logging.warning(f"icacls failed for {path_in_error}. Stdout: {icacls_result.stdout}, Stderr: {icacls_result.stderr}")
                            
                            # Remove read-only attribute
                            attrib_command = ["attrib", "-R", str(path_in_error)]
                            attrib_result = subprocess.run(attrib_command, check=False, capture_output=True, text=True)
                            if attrib_result.returncode != 0:
                                logging.warning(f"attrib -R failed for {path_in_error}. Stdout: {attrib_result.stdout}, Stderr: {attrib_result.stderr}")
                        
                        # Retry the failed operation after permission changes
                        func(path_in_error)
                        logging.debug(f"Successfully retried operation on {path_in_error} after permission change.")
                    except Exception as e:
                        logging.error(f"Failed to change permissions or retry operation for {path_in_error}: {e}")
                        logging.exception(f"Failed to change permissions or retry for {path_in_error}")
                        # If changing permissions or retrying fails, re-raise the original exception
                        # This will be caught by the outer try-except block in cleanup_directory
                        raise exc_info[1]
                elif isinstance(exc_info[1], FileNotFoundError):
                    logging.info(f"FileNotFoundError for {path_in_error} in onerror. File already removed or path issue. Continuing.")
                    # Do not re-raise, as this is a graceful exit for this specific error
                elif isinstance(exc_info[1], OSError) and sys.platform == "win32" and exc_info[1].winerror in [145, 206, 3]:
                    # This case is primarily handled by the outer try-except block's rmdir /S /Q logic
                    # Re-raise to let the outer block handle it
                    logging.debug(f"OSError (Windows specific) for {path_in_error} in onerror. Re-raising for outer handler.")
                    raise exc_info[1]
                else:
                    # For other errors, re-raise the original exception
                    logging.debug(f"Non-PermissionError/FileNotFoundError/Windows-specific OSError for {path_in_error} in onerror. Re-raising.")
                    raise exc_info[1]

            logging.debug(f"Attempting shutil.rmtree for {normalized_path.relative_to(ROOT)}.")
            shutil.rmtree(normalized_path, onerror=onerror)
            logging.info(f"Cleaned up {normalized_path.relative_to(ROOT)} successfully.")
            return
        except FileNotFoundError:
            logging.info(f"FileNotFoundError during cleanup for {normalized_path.relative_to(ROOT)}. Already removed or path issue. Exiting cleanup attempt.")
            return # Gracefully handle if file is already gone
        except (PermissionError, OSError) as e:
            error_message = str(e)
            logging.warning(f"Error during shutil.rmtree for {normalized_path.relative_to(ROOT)} (attempt {i+1}/{max_retries}). Error: {error_message}")
            logging.exception(f"Cleanup error for {normalized_path.relative_to(ROOT)} (attempt {i+1}/{max_retries})")

            # Attempt to remove read-only attributes on Windows for all errors
            if sys.platform == "win32":
                logging.debug(f"Attempting to remove read-only attributes from files in {normalized_path.relative_to(ROOT)}.")
                _remove_readonly_attributes(normalized_path)
                time.sleep(delay_seconds) # Give OS time to apply changes

            # Specific handling for Windows long path issues (WinError 206), "Directory not empty" (WinError 145),
            # and "Path not found" (WinError 3). Also handles general PermissionError.
            if sys.platform == "win32" and (isinstance(e, PermissionError) or e.winerror in [145, 206, 3]):
                logging.debug(f"Detected Windows specific error (Permission, long path, not empty, or not found). Attempting alternative deletion method.")
                try:
                    # Using the UNC path prefix '\\?\' for paths longer than MAX_PATH (260 characters)
                    # This also helps with "Directory not empty" errors by using a more direct OS command
                    # Ensure the path is absolute and resolved before adding UNC prefix
                    abs_path = normalized_path.resolve()
                    long_path_prefix = f"\\\\?\\{abs_path}"
                    
                    logging.debug(f"Attempting 'rmdir /S /Q {long_path_prefix}' for {normalized_path.relative_to(ROOT)}")
                    result = subprocess.run(
                        ["cmd.exe", "/C", "rmdir", "/S", "/Q", long_path_prefix],
                        capture_output=True, text=True, check=False
                    )
                    if result.returncode == 0:
                        logging.info(f"Cleaned up {normalized_path.relative_to(ROOT)} using rmdir /S /Q.")
                        return
                    else:
                        logging.error(f"rmdir /S /Q failed for {normalized_path.relative_to(ROOT)}. Stdout: {result.stdout}, Stderr: {result.stderr}")
                except Exception as sub_e:
                    logging.error(f"Exception during rmdir subprocess call for {normalized_path.relative_to(ROOT)}: {sub_e}")
                    logging.exception(f"Exception during rmdir subprocess call for {normalized_path.relative_to(ROOT)}")
            elif sys.platform != "win32" and isinstance(e, OSError) and "Directory not empty" in error_message:
                logging.debug(f"Detected 'Directory not empty' error on POSIX. Attempting 'rm -rf'.")
                try:
                    subprocess.run(
                        ["rm", "-rf", str(normalized_path)],
                        capture_output=True, text=True, check=True
                    )
                    logging.info(f"Cleaned up {normalized_path.relative_to(ROOT)} using 'rm -rf'.")
                    return
                except subprocess.CalledProcessError as rm_e:
                    logging.error(f"'rm -rf' failed for {normalized_path.relative_to(ROOT)}. Stdout: {rm_e.stdout}, Stderr: {rm_e.stderr}")
                except Exception as rm_e:
                    logging.error(f"Exception during 'rm -rf' subprocess call for {normalized_path.relative_to(ROOT)}: {rm_e}")
                    logging.exception(f"Exception during 'rm -rf' subprocess call for {normalized_path.relative_to(ROOT)}")
            
            # Handle nested Git repositories by attempting 'git clean -fdx'
            git_dir = normalized_path / ".git"
            if git_dir.is_dir():
                logging.debug(f"Detected Git repository in {normalized_path.relative_to(ROOT)}. Attempting 'git clean -fdx'.")
                try:
                    subprocess.run(
                        ["git", "clean", "-fdx"],
                        cwd=normalized_path,
                        capture_output=True, text=True, check=False
                    )
                    logging.debug(f"'git clean -fdx' executed for {normalized_path.relative_to(ROOT)}.")
                except Exception as git_e:
                    logging.error(f"Exception during 'git clean -fdx' for {normalized_path.relative_to(ROOT)}: {git_e}")
                    logging.exception(f"Exception during 'git clean -fdx' for {normalized_path.relative_to(ROOT)}")
                time.sleep(delay_seconds) # Give OS time to apply changes

            # If shutil.rmtree failed and alternative methods didn't succeed, try again after a delay
            # Exponential backoff with jitter
            sleep_time = delay_seconds * (2 ** i) + random.uniform(0, 0.5 * delay_seconds)
            logging.debug(f"Retrying cleanup for {normalized_path.relative_to(ROOT)} in {sleep_time:.2f}s (attempt {i+1}/{max_retries}).")
            time.sleep(sleep_time)
        except Exception as e:
            logging.error(f"Unexpected error cleaning up {normalized_path.relative_to(ROOT)}: {e}")
            logging.exception(f"Unexpected error cleaning up {normalized_path.relative_to(ROOT)}")
            # Do not return here, allow retry or final failure message

    logging.error(f"Failed to clean up {normalized_path.relative_to(ROOT)} after {max_retries} attempts.")

# Helper function to remove read-only attributes on Windows
def _remove_readonly_attributes(path):
    if sys.platform == "win32":
        log_dir = Path("logs")
        log_dir.mkdir(parents=True, exist_ok=True)
        for root, dirs, files in os.walk(path):
            for name in files:
                filepath = Path(root) / name
                try:
                    # Use icacls to remove read-only attribute and grant full control
                    subprocess.run(["icacls", str(filepath), "/remove:r", "/grant:r", "Everyone:(F)"], check=False, capture_output=True)
                    os.chmod(filepath, 0o777) # Also try chmod for good measure
                except Exception as e:
                    logging.warning(f"Could not change permissions for {filepath}: {e}")
                    logging.exception(f"Could not change permissions for {filepath}")
            for name in dirs:
                dirpath = Path(root) / name
                try:
                    subprocess.run(["icacls", str(dirpath), "/remove:r", "/grant:r", "Everyone:(F)"], check=False, capture_output=True)
                    os.chmod(dirpath, 0o777) # Also try chmod for good measure
                except Exception as e:
                    logging.warning(f"Could not change permissions for directory {dirpath}: {e}")
                    logging.exception(f"Could not change permissions for directory {dirpath}")

ROOT = Path(__file__).parent.parent.resolve()
PROJECT_DIR = ROOT / "server"
INPUT_LOG = ROOT / "logs" / "vision_input.txt"
PACKAGE_JSON = ROOT / "package.json" # This is the root package.json
SERVER_PACKAGE_JSON = ROOT / "server" / "package.json" # This is the server's package.json
OUTPUT_DIR = ROOT / "vision_output"
TEMP_TEST_ROOT = ROOT / "temp_test_run" # New temporary directory for testing runs
TEST_COMBINATIONS_ROOT = ROOT / "test_combinations" # New directory for storing codebase versions to test
INDEX_MJS = PROJECT_DIR / "index.mjs"
NODE_MODULES = ROOT / "node_modules"
LOCKFILE = ROOT / "package-lock.json"
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_TAGS_URL = "http://localhost:11434/api/tags"
NPM_INSTALL_MAX_RETRIES = 50 # Max retries for npm install
OLLAMA_QUERY_MAX_ATTEMPTS = 20 # Max attempts for Ollama queries
OLLAMA_RETRY_WAIT_SECONDS = 10.0 # Wait time between Ollama retries
MAX_CONCURRENT_OLLAMA_QUERIES = 1 # Keep limit at 1 concurrent query for better stability
MAX_FILES_TO_ENHANCE = 5 # Limit the number of files processed in one run to reduce memory pressure

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
print("DEBUG: Global variables and directories initialized. Proceeding to function definitions.")
sys.stdout.flush()

def get_available_port(start=8383):
    while start < 9000:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('localhost', start)) != 0:
                return start
        start += 1
    raise OSError("No available ports")

import msvcrt # For Windows file locking
if sys.platform != "win32":
    import fcntl # For POSIX file locking

def wait_for_vision(timeout_seconds: int = 300, check_interval_seconds: int = 1):
    """
    Waits for vision input from logs/vision_input.txt.
    Verifies existence and content, handles race conditions, and includes a timeout.
    """
    print("DEBUG: Entering wait_for_vision function.")
    print(f"Waiting for vision input from {INPUT_LOG.relative_to(ROOT)} (timeout: {timeout_seconds}s, interval: {check_interval_seconds}s)...")
    sys.stdout.flush()
    
    start_time = time.time()
    last_processed_mtime = 0 # To track the modification time of the last successfully processed file

    while time.time() - start_time < timeout_seconds:
        current_elapsed_time = int(time.time() - start_time)
        print(f"DEBUG: Checking if {INPUT_LOG.relative_to(ROOT)} exists (elapsed: {current_elapsed_time}s)...")
        sys.stdout.flush()
        
        if INPUT_LOG.exists():
            current_file_mtime = INPUT_LOG.stat().st_mtime
            
            # Only attempt to read if the file has been modified since the last successful read
            if current_file_mtime <= last_processed_mtime:
                print(f"DEBUG: {INPUT_LOG.relative_to(ROOT)} exists but has not been modified since last processed. Waiting...")
                sys.stdout.flush()
                time.sleep(check_interval_seconds)
                continue
            
            print(f"DEBUG: {INPUT_LOG.relative_to(ROOT)} exists and has new content. Attempting to read and lock...")
            sys.stdout.flush()
            
            try:
                # Implement file locking
                with open(INPUT_LOG, 'r+', encoding="utf8") as f:
                    if sys.platform == "win32":
                        msvcrt.locking(f.fileno(), msvcrt.LK_NBLCK, 1) # Non-blocking lock
                    else:
                        fcntl.flock(f.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB) # Exclusive, non-blocking lock
                    
                    content = f.read().strip()
                    print(f"DEBUG: Content read. Length: {len(content)}.")
                    sys.stdout.flush()
                    
                    if not content:
                        print(f"DEBUG: {INPUT_LOG.relative_to(ROOT)} is empty. Waiting...")
                        sys.stdout.flush()
                        continue

                    # Attempt JSON parsing and validation first
                    is_content_valid = False
                    try:
                        json_content = json.loads(content)
                        if isinstance(json_content, dict) and "vision_data" in json_content:
                            is_content_valid = True
                            print("DEBUG: Vision input is valid JSON and contains 'vision_data'.")
                            sys.stdout.flush()
                        else:
                            print(f"WARNING: {INPUT_LOG.relative_to(ROOT)} content is JSON but not in expected format (missing 'vision_data' or not a dict). Content snippet: {content[:200]}.")
                            sys.stdout.flush()
                    except json.JSONDecodeError:
                        print(f"DEBUG: {INPUT_LOG.relative_to(ROOT)} content is not valid JSON. Checking as plain text. Content snippet: {content[:200]}.")
                        sys.stdout.flush()
                    
                    # If not valid JSON, check if it's meaningful plain text
                    if not is_content_valid and len(content) > 10:
                        is_content_valid = True
                        print("DEBUG: Vision input found and appears valid (plain text).")
                        sys.stdout.flush()

                    if is_content_valid:
                        print("DEBUG: Vision input found and appears valid. Exiting wait_for_vision.")
                        sys.stdout.flush()
                        
                        # Atomically delete the file after reading to prevent race conditions
                        try:
                            # Truncate and close the file to release lock before unlinking
                            f.seek(0)
                            f.truncate()
                            # Release lock before unlinking (important for Windows)
                            if sys.platform == "win32":
                                msvcrt.locking(f.fileno(), msvcrt.LK_UNLCK, 1)
                            else:
                                fcntl.flock(f.fileno(), fcntl.LOCK_UN)
                            f.close() # Close the file handle
                            
                            INPUT_LOG.unlink(missing_ok=True)
                            print(f"DEBUG: Deleted {INPUT_LOG.relative_to(ROOT)} to prevent race conditions.")
                            sys.stdout.flush()
                        except Exception as e:
                            print(f"ERROR: Could not delete {INPUT_LOG.relative_to(ROOT)}: {e}")
                            sys.stdout.flush()
                        
                        last_processed_mtime = current_file_mtime # ONLY update here on successful processing
                        return content
                    else:
                        print(f"DEBUG: {INPUT_LOG.relative_to(ROOT)} is too short ({len(content)} chars) or not valid. Waiting...")
                        sys.stdout.flush()
                        continue # Continue waiting
            except (BlockingIOError, IOError) as e: # Catch BlockingIOError for non-blocking locks
                print(f"DEBUG: File {INPUT_LOG.relative_to(ROOT)} is locked by another process ({e}). Retrying...")
                sys.stdout.flush()
            except Exception as e:
                print(f"ERROR: Error reading or processing {INPUT_LOG.relative_to(ROOT)}: {e}. Retrying...")
                sys.stdout.flush()
            
            time.sleep(check_interval_seconds) # Wait before checking again
        else:
            print(f"DEBUG: {INPUT_LOG.relative_to(ROOT)} does not exist. Waiting...")
            sys.stdout.flush()
            time.sleep(check_interval_seconds) # Wait before checking again
            
    print(f"WARNING: Timeout reached. No vision input received from {INPUT_LOG.relative_to(ROOT)} after {timeout_seconds} seconds. Providing dummy input.")
    sys.stdout.flush()
    return "Dummy vision input for testing purposes." # Return dummy input if timeout is reached

def scrub_package_jsons():
    print("Scrubbing malformed TypeScript tags...")
    for path in [PACKAGE_JSON, SERVER_PACKAGE_JSON] + list(ROOT.glob("**/package.json")):
        if not path.exists():
            continue
        try:
            txt = path.read_text(encoding="utf8")
            patched = re.sub(r'"typescript"\s*:\s*"[^"]*>=\^?3\.9\.3[^"]*"', '"typescript": "^4.9.5"', txt)
            if patched != txt:
                path.write_text(patched)
                print(f"Patched: {path.relative_to(ROOT)}")
        except Exception as e:
            print(f"Could not scrub {path.relative_to(ROOT)}: {e}")

def reset_dependencies():
    # Terminate any lingering node processes that might hold file locks
    print("Attempting to terminate any lingering node.exe processes...")
    subprocess.run(["taskkill", "/F", "/IM", "node.exe"], shell=True, check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(2) # Give processes time to terminate

    # Fix network registry issues that cause ECONNRESET
    subprocess.run(["npm", "config", "delete", "proxy"], shell=True, cwd=ROOT)
    subprocess.run(["npm", "config", "delete", "https-proxy"], shell=True, cwd=ROOT)
    subprocess.run(["npm", "config", "set", "registry", "https://registry.npmjs.org/"], shell=True, cwd=ROOT)

    for attempt in range(1, NPM_INSTALL_MAX_RETRIES + 1):
        print(f"npm install attempt {attempt}")

        # Remove node_modules directory using the robust cleanup function
        cleanup_directory(NODE_MODULES)
        time.sleep(1) # Small delay after directory cleanup

        # Remove lockfile
        LOCKFILE.unlink(missing_ok=True)
        time.sleep(1) # Small delay after lockfile removal

        # Purge npm cache with retries
        cache_cleaned = False
        for cache_attempt in range(3): # Retry cache clean a few times
            print(f"Attempting to clean npm cache (attempt {cache_attempt+1}/3)...")
            cache_result = subprocess.run(["npm", "cache", "clean", "--force"], shell=True, cwd=ROOT, capture_output=True, text=True)
            if cache_result.returncode == 0:
                print("npm cache cleaned successfully.")
                cache_cleaned = True
                break
            else:
                print(f"npm cache clean failed: {cache_result.stderr}")
                time.sleep(OLLAMA_RETRY_WAIT_SECONDS) # Wait before retrying cache clean
        
        if not cache_cleaned:
            print("Warning: npm cache could not be cleaned after multiple attempts. Proceeding anyway.")

        # Verify npm cache integrity
        subprocess.run(["npm", "cache", "verify"], shell=True, cwd=ROOT)
        time.sleep(2) # Small delay after cache operations

        # Run install
        # Add a small delay before npm install to ensure resources are released
        time.sleep(OLLAMA_RETRY_WAIT_SECONDS * 2) # Increased delay before install
        result = subprocess.run(["npm", "install", "--force"], shell=True, capture_output=True, text=True, cwd=ROOT)

        if result.returncode == 0:
            print("Dependencies installed.")
            return True
        else:
            print(f"npm install failed:\n{result.stderr}")
            time.sleep(OLLAMA_RETRY_WAIT_SECONDS * attempt) # Use the new wait variable

    return False

def get_model_with_fallback(
    preferred_reasoning=["gemma3:latest", "llama2:latest", "codellama:latest", "mistral:latest"]
) -> str | None: # Removed vision_model from return type
    print("Testing available Ollama models...")
    sys.stdout.flush()

    available_models = []
    try:
        response = requests.get(OLLAMA_TAGS_URL, timeout=10)
        response.raise_for_status()
        tags_data = response.json()
        available_models = [m["model"] for m in tags_data.get("models", [])]
        print(f"Available Ollama models: {', '.join(available_models)}")
        sys.stdout.flush()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to Ollama server. Please ensure Ollama is running.")
        sys.stdout.flush()
        return None
    except Exception as e:
        print(f"Error fetching Ollama models: {e}")
        sys.stdout.flush()
        return None

    reasoning_model = None

    # Test reasoning models
    test_prompt_reasoning = "Explain the concept of a smart home in one sentence."
    for model_name in preferred_reasoning:
        if model_name not in available_models:
            print(f"Reasoning model {model_name} is not available locally. Skipping.")
            sys.stdout.flush()
            continue
        print(f"Testing reasoning model: {model_name}")
        sys.stdout.flush()
        try:
            time.sleep(0.1)
            response = requests.post(
                OLLAMA_URL,
                json={"model": model_name, "prompt": test_prompt_reasoning, "stream": True},
                timeout=1200 # Increased timeout for model testing to match global socket timeout
            )
            full_response_content = []
            for line in response.iter_lines():
                if line:
                    try:
                        json_response = json.loads(line.decode('utf-8'))
                        if "error" in json_response:
                            error_msg = f"Ollama API error during model test: {json_response['error']}"
                            print(f"ERROR: {error_msg}")
                            sys.stdout.flush()
                            break # Stop processing on error
                        elif "response" in json_response:
                            full_response_content.append(json_response["response"])
                        if json_response.get("done") is True:
                            break
                    except json.JSONDecodeError:
                        # This can happen if a line is incomplete or not valid JSON yet.
                        # We can log it but continue processing, as subsequent lines might be valid.
                        print(f"WARNING: Could not decode JSON from Ollama stream line during model test. Skipping: {line.decode('utf-8')[:100]}...")
                        sys.stdout.flush()
                        continue # Skip malformed JSON lines and continue to next line
                    except Exception as e:
                        print(f"ERROR: Unexpected error processing Ollama stream line during model test: {e}. Line: {line.decode('utf-8')[:100]}...")
                        sys.stdout.flush()
                        break # Stop processing on unexpected error
            raw_text = "".join(full_response_content).strip()
            sys.stdout.flush()

            if not raw_text:
                print(f"Reasoning model {model_name} returned an empty or unparseable response during test.")
                sys.stdout.flush()
                continue # Try next model if response is empty

            if not is_corrupt(raw_text, model_name): # Pass model_name for better logging
                if len(raw_text) > 10:
                    print(f"Reasoning model {model_name} is responsive and healthy.")
                    sys.stdout.flush()
                    reasoning_model = model_name
                    break
                else:
                    print(f"Reasoning model {model_name} responded but was too short ({len(raw_text)} chars). Raw text: {raw_text[:200]}...") # Log more of the raw text
                    sys.stdout.flush()
            else:
                print(f"Reasoning model {model_name} responded but was flagged as corrupt. Raw text (first 200 chars): {raw_text[:200]}...")
                sys.stdout.flush()
        except requests.exceptions.Timeout:
            print(f"Timeout when testing reasoning model: {model_name}")
            sys.stdout.flush()
        except requests.exceptions.ConnectionError as e:
            print(f"Connection error when testing reasoning model {model_name}: {e}")
            sys.stdout.flush()
        except Exception as e:
            print(f"Error testing reasoning model {model_name}: {e}")
            sys.stdout.flush()

    if not reasoning_model:
        print("No suitable reasoning Ollama model found among preferred options or available models.")
        print("No suitable reasoning Ollama model found among preferred options or available models. Attempting generic fallback.")
        sys.stdout.flush()
        # Try a generic model if preferred ones fail
        if "llama2:latest" in available_models:
            print("Attempting to use llama2:latest as a generic fallback.")
            sys.stdout.flush()
            return "llama2:latest"
        elif available_models:
            # If llama2 isn't available, try the first available model
            print(f"Attempting to use {available_models[0]} as a generic fallback.")
            sys.stdout.flush()
            return available_models[0]
        return None # Return None if no reasoning model is found

    return reasoning_model

def query_ollama(model: str, prompt: str, timeout: int = 1200) -> str | None:
    """Queries a text-based Ollama model."""
    # Preflight connection check
    try:
        sock = socket.create_connection(("localhost", 11434), timeout=2)
        sock.close()
    except Exception as e:
        print(f"Preflight connection check failed: {e}")
        sys.stdout.flush()
        return None

    log_dir = Path("logs")
    log_dir.mkdir(parents=True, exist_ok=True)

    try:
        res = requests.post(OLLAMA_URL, json={"model": model, "prompt": prompt, "stream": True}, timeout=timeout)
        full_response_content = []
        for line in res.iter_lines():
            if line:
                try:
                    json_response = json.loads(line.decode('utf-8'))
                    if "error" in json_response:
                        error_msg = f"Ollama API error: {json_response['error']}"
                        print(f"ERROR: {error_msg}")
                        sys.stdout.flush()
                        with open(log_dir / "ollama_errors.txt", "a", encoding="utf8") as log:
                            log.write(f"[{datetime.now()}] {error_msg}\n")
                        return None
                    elif json_response.get("done") is True:
                        break
                    elif "response" in json_response:
                        full_response_content.append(json_response["response"])
                except json.JSONDecodeError:
                    error_msg = f"Warning: Could not decode JSON from Ollama stream line. Skipping: {line.decode('utf-8')[:100]}..."
                    print(f"WARNING: {error_msg}")
                    sys.stdout.flush()
                    with open(log_dir / "ollama_errors.txt", "a", encoding="utf8") as log:
                        log.write(f"[{datetime.now()}] {error_msg}\n")
                except Exception as e:
                    error_msg = f"Unexpected error processing Ollama stream line: {e}. Line: {line.decode('utf-8')[:100]}..."
                    print(f"ERROR: {error_msg}")
                    sys.stdout.flush()
                    with open(log_dir / "ollama_errors.txt", "a", encoding="utf8") as log:
                        log.write(f"[{datetime.now()}] {error_msg}\n")
        raw_text = "".join(full_response_content).strip()
        print(f"DEBUG: Ollama query raw_text (first 200 chars): {raw_text[:200]}...")
        sys.stdout.flush()

        if not raw_text:
            error_msg = f"Ollama returned an empty or unparseable response. Status: {res.status_code}. Raw response text: {res.text[:500]}..."
            print(f"ERROR: {error_msg}")
            sys.stdout.flush()
            with open(log_dir / "ollama_errors.txt", "a", encoding="utf8") as log:
                log.write(f"[{datetime.now()}] {error_msg}\n")
            return None
        return raw_text
    except requests.exceptions.Timeout:
        error_msg = f"Ollama query timed out."
        print(f"ERROR: {error_msg}")
        sys.stdout.flush()
        with open(log_dir / "ollama_errors.txt", "a", encoding="utf8") as log:
                log.write(f"[{datetime.now()}] {error_msg}\n")
    except requests.exceptions.ConnectionError as e:
        error_msg = f"Error querying Ollama (Connection Error): {e}"
        print(f"ERROR: {error_msg}")
        sys.stdout.flush()
        with open(log_dir / "ollama_errors.txt", "a", encoding="utf8") as log:
                log.write(f"[{datetime.now()}] {error_msg}\n")
    except Exception as e:
        error_msg = f"Error querying Ollama (General Error): {e}"
        print(f"ERROR: {error_msg}")
        sys.stdout.flush()
        with open(log_dir / "ollama_errors.txt", "a", encoding="utf8") as log:
                log.write(f"[{datetime.now()}] {error_msg}\n")
    return None

def query_ollama_with_retry(model: str, prompt: str, timeout: int = 1200, max_attempts: int = OLLAMA_QUERY_MAX_ATTEMPTS) -> str | None:
    """Queries an Ollama model with retries, handling timeouts and cooldowns."""
    for attempt in range(1, max_attempts + 1):
        try:
            result = query_ollama(model, prompt, timeout)
            if result and len(result.strip()) > 0:
                return result
            print(f"Retry {attempt}/{max_attempts} — failed or empty response")
            sys.stdout.flush()
        except requests.exceptions.Timeout:
            print(f"Ollama query timed out (attempt {attempt}/{max_attempts}). Retrying...")
            sys.stdout.flush()
        except requests.exceptions.ConnectionError as e:
            print(f"Ollama connection error (attempt {attempt}/{max_attempts}): {e}. Retrying...")
            sys.stdout.flush()
        except Exception as e:
            print(f"Unexpected error during Ollama query (attempt {attempt}/{max_attempts}): {e}. Retrying...")
            sys.stdout.flush()
        
        time.sleep(OLLAMA_RETRY_WAIT_SECONDS * attempt)
    print(f"Ollama query failed after {max_attempts} retries. Giving up.")
    sys.stdout.flush()
    return None

def is_corrupt(text, model_name="unknown"):
    """
    Checks if the given text contains patterns indicative of corrupted code or raw Ollama stream data.
    This helps filter out malformed AI responses.
    """
    corruption_patterns = {
        "TS/JS Syntax Error": r"\?\s*:", # Common syntax error in TS/JS
        "Module Resolution Error": r"Could not resolve", # Module resolution error
        "Module Not Found": r"MODULE_NOT_FOUND", # Module not found error
        "Variable Redeclaration": r"already been declared", # Variable redeclaration error
        "Unexpected Token": r"unexpected token", # General syntax error
        "Ollama Error JSON": r'\{"error":"[^"]+"\}', # Detects {"error":"..."} JSON
    }
    
    detected_issues = []
    for pattern_name, pattern_regex in corruption_patterns.items():
        if re.search(pattern_regex, text):
            detected_issues.append(pattern_name)

    if detected_issues:
        print(f"DEBUG: is_corrupt detected corruption in model '{model_name}' due to: {', '.join(detected_issues)}. Raw text (first 200 chars): {text[:200]}...")
        sys.stdout.flush()
        return True
    return False

def test_file_integrity(file_path: Path) -> bool:
    """Tests a single TypeScript file for common corruption patterns."""
    try:
        content = file_path.read_text(encoding="utf8").strip()
        if not content:
            print(f"Test failed for {file_path.name}: File is empty.")
            sys.stdout.flush()
            return False
        if any(err in content for err in ["MODULE_NOT_FOUND", "Could not resolve", "already been declared", "unexpected token"]):
            print(f"Test failed for {file_path.name}: Error pattern found.")
            sys.stdout.flush()
            return False
        print(f"Test passed for {file_path.name}.")
        sys.stdout.flush()
        return True
    except Exception as e:
        print(f"Error testing {file_path.name}: {e}")
        sys.stdout.flush()
        return False

def heal_single_file(file_path: Path, vision: str, model: str, lines_per_chunk: int = 10, max_healing_retries: int = 30, error_context: str = "", all_enhancement_summaries: list = None) -> bool:
    """Heals a single TypeScript file by chunking and querying the model."""
    log_dir = Path("logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / "healing_log.txt"

    if all_enhancement_summaries is None:
        all_enhancement_summaries = [] # Initialize if not provided

    file_healed_successfully = False
    last_compilation_error = ""
    for attempt in range(max_healing_retries + 1):
        print(f"\nHealing file: {file_path.relative_to(ROOT)} (Attempt {attempt + 1}/{max_healing_retries + 1})")
        sys.stdout.flush()
        try:
            source = file_path.read_text(encoding="utf8").splitlines()
            chunks = [source[i:i + lines_per_chunk] for i in range(0, len(source), lines_per_chunk)]
            healed_chunks = []

            for i, chunk in enumerate(chunks):
                chunk_text = "\n".join(chunk)
                prompt = (
                    f"Repair chunk {i+1}/{len(chunks)} in `{file_path.name}`.\n"
                    f"{vision}\nFix syntax, imports, structure."
                )
                if last_compilation_error:
                    prompt += f"\nPrevious compilation error:\n```\n{last_compilation_error}\n```"
                if error_context:
                    prompt += f"\nRuntime error context:\n```\n{error_context}\n```"
                prompt += "\nRespond with valid TypeScript only — no explanations.\n=== START ===\n" + chunk_text
                
                result = query_ollama_with_retry(model, prompt, timeout=1200)
                if result:
                    healed_chunks.append(result + "\n")
                    print(f"Healed chunk {i+1}/{len(chunks)}")
                    sys.stdout.flush()
                else:
                    healed_chunks.append(chunk_text + "\n")
                    print(f"Fallback for chunk {i+1}/{len(chunks)}")
                    sys.stdout.flush()
                    with open(log_path, "a", encoding="utf8") as log:
                        log.write(f"[{datetime.now()}] Fallback used in {file_path.relative_to(ROOT)}, chunk {i+1}\n")

            file_path.write_text("\n".join(healed_chunks), encoding="utf8")

            integrity_passed = test_file_integrity(file_path)
            compilation_passed, current_compilation_error = test_typescript_compilation()
            
            if integrity_passed and compilation_passed:
                print(f"File {file_path.relative_to(ROOT)} healed and passed integrity and compilation tests.")
                sys.stdout.flush()
                file_healed_successfully = True
                all_enhancement_summaries.append(f"Successfully healed and validated {file_path.relative_to(ROOT)}.")
                break
            else:
                last_compilation_error = current_compilation_error
                print(f"File {file_path.relative_to(ROOT)} failed post-healing tests. Retrying healing...")
                sys.stdout.flush()
                time.sleep(OLLAMA_RETRY_WAIT_SECONDS * (attempt + 1))

        except Exception as e:
            print(f"Error healing {file_path.relative_to(ROOT)}: {e}")
            sys.stdout.flush()
            with open(log_path, "a", encoding="utf8") as log:
                log.write(f"[{datetime.now()}] Exception in {file_path.relative_to(ROOT)}: {e}\n")
            time.sleep(OLLAMA_RETRY_WAIT_SECONDS * (attempt + 1))
    else:
        print(f"File {file_path.relative_to(ROOT)} failed to heal after {max_healing_retries + 1} attempts.")
        sys.stdout.flush()
        file_healed_successfully = False
        all_enhancement_summaries.append(f"Failed to heal {file_path.relative_to(ROOT)} after multiple attempts.")
    return file_healed_successfully

def check_file_health_status(file_path: Path, healthy_files: list, unhealthy_files: list):
    """Checks if a single TypeScript file is healthy (integrity only) and categorizes it."""
    integrity_passed = test_file_integrity(file_path)

    if integrity_passed:
        print(f"File {file_path.relative_to(ROOT)} is healthy.")
        sys.stdout.flush()
        healthy_files.append(file_path)
    else:
        print(f"File {file.relative_to(ROOT)} is unhealthy.")
        sys.stdout.flush()
        unhealthy_files.append(file_path)

def concurrent_healing(path, vision_text, reasoning_model, lines_per_chunk=10, max_healing_retries=30, all_enhancement_summaries: list = None) -> bool:
    print("DEBUG: Entering concurrent_healing function.")
    print("Starting concurrent file health checks...")
    sys.stdout.flush()
    health_check_threads = []
    healthy_files = []
    unhealthy_files = []

    if all_enhancement_summaries is None:
        all_enhancement_summaries = [] # Initialize if not provided

    log_dir = Path("logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / "healing_log.txt"
    log_path.write_text(f"Healing session: {datetime.now()}\n", encoding="utf8")

    print("DEBUG: Iterating through files for health checks.")
    sys.stdout.flush()
    for file in path.rglob("*.ts"):
        if "node_modules" in str(file) or "vite.ts" in str(file) or "vite.config.ts" in str(file) or str(file).endswith(".d.ts"):
            print(f"DEBUG: Skipping health check for {file.relative_to(ROOT)} (in node_modules, excluded build/config file, or a declaration file).")
            sys.stdout.flush()
            continue
        thread = threading.Thread(
            target=check_file_health_status,
            args=(file, healthy_files, unhealthy_files),
            name=f"HealthCheckThread-{file.name}"
        )
        health_check_threads.append(thread)
        thread.start()
        time.sleep(0.05)

    print("DEBUG: Waiting for all health check threads to complete.")
    sys.stdout.flush()
    for thread in health_check_threads:
        thread.join()
    print("All concurrent file health checks completed.")
    sys.stdout.flush()

    if not unhealthy_files:
        print("All TypeScript files are already healthy. No healing needed.")
        print("DEBUG: Exiting concurrent_healing function (no unhealthy files).")
        sys.stdout.flush()
        return True

    print(f"Starting concurrent healing for {len(unhealthy_files)} unhealthy files...")
    sys.stdout.flush()
    healing_threads = []
    healing_results = [] # To store boolean results of healing attempts

    # Use a semaphore to limit concurrent Ollama queries
    ollama_semaphore = threading.Semaphore(MAX_CONCURRENT_OLLAMA_QUERIES)

    for file in unhealthy_files:
        # Each thread will acquire and release the semaphore
        thread = threading.Thread(
            target=lambda f, v_text, r_model, lpc, mhr, sem, res_list, summaries_list:
                sem.acquire() or res_list.append(heal_single_file(f, v_text, r_model, lpc, mhr, summaries_list)) or sem.release(),
            args=(file, vision_text, reasoning_model, lines_per_chunk, max_healing_retries, ollama_semaphore, healing_results, all_enhancement_summaries),
            name=f"HealingThread-{file.name}"
        )
        healing_threads.append(thread)
        thread.start()
        time.sleep(0.1) # Small stagger to avoid immediate contention

    print("DEBUG: Waiting for all healing threads to complete.")
    sys.stdout.flush()
    for thread in healing_threads:
        thread.join()
    print("All concurrent healing attempts completed.")
    sys.stdout.flush()

    # Check if all unhealthy files were successfully healed
    all_healed = all(healing_results)
    if all_healed:
        print("All previously unhealthy files were successfully healed.")
        sys.stdout.flush()
    else:
        print("WARNING: Some files failed to heal after multiple attempts.")
        sys.stdout.flush()
    
    return all_healed

def test_typescript_compilation():
    """
    Runs TypeScript compilation in the current working directory (expected to be TEMP_TEST_ROOT).
    Returns a tuple: (bool success, str error_output).
    """
    print("DEBUG: Running TypeScript compilation (tsc)...")
    print(f"DEBUG: Current working directory for tsc: {os.getcwd()}")
    sys.stdout.flush()
    try:
        # First, check if npm is available
        npm_check = subprocess.run(["npm", "--version"], capture_output=True, text=True, check=False, cwd=os.getcwd(), shell=True)
        if npm_check.returncode != 0:
            error_msg = f"ERROR: 'npm' command not found or not working. Output: {npm_check.stdout + npm_check.stderr}"
            print(error_msg)
            sys.stdout.flush()
            return False, error_msg
        print(f"DEBUG: npm version: {npm_check.stdout.strip()}")
        sys.stdout.flush()

        # Use npm exec tsc to ensure the local TypeScript compiler is used
        result = subprocess.run(
            ["npm", "exec", "tsc", "--", "--noEmit"], # --noEmit to only check types, not generate JS files
            capture_output=True, text=True, check=False, cwd=os.getcwd(), shell=True
        )
        if result.returncode == 0:
            print("DEBUG: TypeScript compilation successful.")
            sys.stdout.flush()
            return True, ""
        else:
            error_output = result.stdout + result.stderr
            print(f"ERROR: TypeScript compilation failed:\n{error_output}")
            sys.stdout.flush()
            return False, error_output
    except FileNotFoundError:
        error_msg = "ERROR: 'npm' command not found. Ensure Node.js is installed and in PATH."
        print(error_msg)
        sys.stdout.flush()
        return False, error_msg
    except Exception as e:
        error_msg = f"ERROR: An unexpected error occurred during TypeScript compilation: {e}"
        print(error_msg)
        sys.stdout.flush()
        return False, error_msg

def validate_codebase() -> bool:
    """
    Performs a comprehensive validation of the codebase, including TypeScript compilation.
    Returns True if validation passes, False otherwise.
    """
    print("DEBUG: Running comprehensive codebase validation...")
    sys.stdout.flush()
    
    # 1. Run TypeScript compilation
    compilation_passed, compilation_error = test_typescript_compilation()
    if not compilation_passed:
        print(f"ERROR: Codebase validation failed: TypeScript compilation errors detected.\n{compilation_error}")
        sys.stdout.flush()
        return False
    
    print("DEBUG: TypeScript compilation passed.")
    sys.stdout.flush()
    
    # Add more validation steps here if needed, e.g., linting, basic static analysis
    # For now, TypeScript compilation is the primary validation.

    print("DEBUG: Codebase validation successful.")
    sys.stdout.flush()
    return True

def main():
    original_cwd = os.getcwd()
    success = True
    log_dir = Path("logs")
    log_dir.mkdir(parents=True, exist_ok=True)

    try:
        print("DEBUG: Entering main function.")
        sys.stdout.flush()
        
        # Step 1: Initial cleanup of temporary directories
        print("Initial cleanup of temporary directories...")
        sys.stdout.flush()
        cleanup_directory(TEMP_TEST_ROOT)
        cleanup_directory(TEST_COMBINATIONS_ROOT)

        # Step 2: Copy the current codebase to a temporary test directory
        print(f"Copying current codebase to {TEMP_TEST_ROOT.relative_to(ROOT)}...")
        sys.stdout.flush()
        copy_directory(ROOT, TEMP_TEST_ROOT)

        # Change current working directory to TEMP_TEST_ROOT for subsequent operations
        os.chdir(TEMP_TEST_ROOT)
        print(f"Changed current working directory to: {os.getcwd()}")
        sys.stdout.flush()

        # Create tsconfig.json files in the temp_test_run directory
        print("DEBUG: Creating tsconfig.json files in temp_test_run...")
        sys.stdout.flush()
        server_tsconfig_path = TEMP_TEST_ROOT / "server" / "tsconfig.json"
        client_tsconfig_path = TEMP_TEST_ROOT / "client" / "tsconfig.json"

        server_tsconfig_content = """{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "lib": ["es2020", "dom"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./",
    "resolveJsonModule": true,
    "allowJs": true
  },
  "include": [
    "**/*.ts",
    "**/*.js"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}"""
        client_tsconfig_content = """{
  "compilerOptions": {
    "target": "es2020",
    "module": "esnext",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}"""
        server_tsconfig_path.write_text(server_tsconfig_content, encoding="utf8")
        client_tsconfig_path.write_text(client_tsconfig_content, encoding="utf8")
        print("DEBUG: tsconfig.json files created.")
        sys.stdout.flush()

        # Step 3: Wait for vision input
        vision_text = wait_for_vision(timeout_seconds=600, check_interval_seconds=2) # Increased timeout for robustness
        if not vision_text:
            print("ERROR: No vision input received. Aborting main execution.")
            sys.stdout.flush()
            success = False
            return # Exit early if no vision input

        # Step 4: Get available Ollama models
        reasoning_model = get_model_with_fallback()
        if not reasoning_model:
            print("ERROR: No suitable Ollama model found. Aborting main execution.")
            sys.stdout.flush()
            success = False
            return # Exit early if no model

        # Step 0: Clean/Heal corrupted TypeScript files (after copying to temp_test_run and getting models)
        clean_corrupted_ts_files(vision_text, reasoning_model)

        # Step 5: Scrub package.json files
        print("\nScrubbing package.json files...")
        sys.stdout.flush()
        scrub_package_jsons()

        # Step 6: Reset dependencies (npm install)
        print("\nResetting dependencies...")
        sys.stdout.flush()
        if not reset_dependencies():
            print("ERROR: Failed to install dependencies. Aborting main execution.")
            sys.stdout.flush()
            success = False
            return # Exit early if dependencies fail

        # Step 7: Test TypeScript compilation before enhancement
        print("\nTesting TypeScript compilation (pre-enhancement)...")
        sys.stdout.flush()
        compilation_passed_pre, pre_compilation_error = test_typescript_compilation()
        if not compilation_passed_pre:
            print(f"WARNING: TypeScript compilation failed before enhancement:\n{pre_compilation_error}")
            sys.stdout.flush()
        else:
            print("TypeScript compilation passed before enhancement.")
            sys.stdout.flush()

        # Step 8: Concurrent healing/enhancement of TypeScript files
        print("\nStarting concurrent healing/enhancement of TypeScript files...")
        sys.stdout.flush()
        ts_source_dir = TEMP_TEST_ROOT / "client" / "src"
        if not ts_source_dir.exists():
            print(f"WARNING: TypeScript source directory {ts_source_dir.relative_to(ROOT)} does not exist. Skipping enhancement.")
            sys.stdout.flush()
        else:
            healing_success = concurrent_healing(ts_source_dir, vision_text, reasoning_model)
            if not healing_success:
                print("WARNING: Not all TypeScript files were successfully healed/enhanced.")
                sys.stdout.flush()
            else:
                print("All TypeScript files processed by healing/enhancement successfully.")
                sys.stdout.flush()

        # Step 9: Run final codebase validation (TypeScript compilation)
        print("\nRunning final codebase validation (TypeScript compilation)...")
        sys.stdout.flush()
        if not validate_codebase():
            print("ERROR: Final codebase validation failed. Aborting main execution.")
            sys.stdout.flush()
            success = False
            return # Exit early if validation fails
        print("Final codebase validation successful.")
        sys.stdout.flush()

        # Step 10: Run the app and capture output
        print("\nRunning app and capturing output...")
        sys.stdout.flush()
        app_output, app_return_code = run_app_and_capture_output(TEMP_TEST_ROOT)
        print(f"App exited with return code: {app_return_code}")
        sys.stdout.flush()
        print("\n--- Captured App Output ---")
        sys.stdout.flush()
        print(app_output)
        sys.stdout.flush()
        print("---------------------------")
        sys.stdout.flush()

        # Step 11: Detect features from app output
        print("\n--- Detecting Features from App Output ---")
        sys.stdout.flush()
        detected_features = detect_features_from_output(app_output)
        if detected_features:
            for feature in detected_features:
                print(f"- {feature}")
                sys.stdout.flush()
        else:
            print("No features detected.")
            sys.stdout.flush()
        print("-----------------------------------------")
        sys.stdout.flush()

        # Step 12: Run API tests
        print("\n--- Running API Tests ---")
        sys.stdout.flush()
        verified_api_features = run_api_tests(base_url="http://localhost:3000") # Assuming app runs on 3000
        if verified_api_features:
            for feature in verified_api_features:
                print(f"- {feature}")
                sys.stdout.flush()
        else:
            print("No API features verified.")
            sys.stdout.flush()
        print("-----------------------------")
        sys.stdout.flush()

        # Step 13: Run browser tests (requires agent interaction)
        print("\n--- Running Browser Tests ---")
        sys.stdout.flush()
        detected_browser_features = run_browser_tests(app_url="http://localhost:3000")
        if detected_browser_features:
            for feature in detected_browser_features:
                print(f"- {feature}")
                sys.stdout.flush()
        else:
            print("No browser features detected.")
            sys.stdout.flush()
        print("---------------------------------")
        sys.stdout.flush()

        # Step 14: Cleanup mock/simulated/fake files
        print("\nCleaning up mock/simulated/fake files...")
        sys.stdout.flush()
        cleanup_mock_files(TEMP_TEST_ROOT)
        sys.stdout.flush()

    except Exception as e:
        print(f"CRITICAL ERROR in main execution: {e}")
        sys.stdout.flush()
        import traceback
        traceback.print_exc() # Print full traceback for critical errors
        sys.stdout.flush()
        with open(log_dir / "critical_errors.log", "a", encoding="utf8") as log_file:
            log_file.write(f"[{datetime.now()}] CRITICAL ERROR in main: {e}\n")
            traceback.print_exc(file=log_file) # Also log traceback to file
        success = False
    finally:
        # Always attempt to change back to the original directory
        os.chdir(original_cwd)
        print(f"Returned to original working directory: {os.getcwd()}")
        sys.stdout.flush()
        if not success:
            print("Main execution completed with errors.")
            sys.stdout.flush()
        else:
            print("Main execution completed successfully.")
            sys.stdout.flush()

def rename_js_to_cjs(file_path: Path):
    """
    Renames a .js file to .cjs. Handles cases where the target file already exists
    and potential OSError during renaming.
    """
    log_dir = Path("logs")
    log_dir.mkdir(parents=True, exist_ok=True)

    if not file_path.exists():
        print(f"WARNING: File not found for renaming: {file_path.relative_to(ROOT)}")
        sys.stdout.flush()
        with open(log_dir / "rename_errors.log", "a", encoding="utf8") as log_file:
            log_file.write(f"[{datetime.now()}] WARNING: File not found for renaming: {file_path.relative_to(ROOT)}\n")
        return False
    
    # Ensure the file has a .js extension (case-insensitive)
    if file_path.suffix.lower() == ".js":
        new_path = file_path.with_suffix(".cjs")
    else:
        print(f"WARNING: File {file_path.relative_to(ROOT)} is not a .js file, skipping rename.")
        sys.stdout.flush()
        with open(log_dir / "rename_errors.log", "a", encoding="utf8") as log_file:
            log_file.write(f"[{datetime.now()}] WARNING: File {file_path.relative_to(ROOT)} is not a .js file, skipping rename.\n")
        return False

    if new_path.exists():
        print(f"DEBUG: Target file {new_path.relative_to(ROOT)} already exists. Attempting to overwrite.")
        sys.stdout.flush()
        try:
            # Use cleanup_directory for robustness if it's a directory or has permission issues
            if new_path.is_dir():
                cleanup_directory(new_path)
            else:
                new_path.unlink() # Use unlink for files
            print(f"DEBUG: Successfully removed existing target file {new_path.relative_to(ROOT)}.")
            sys.stdout.flush()
        except Exception as e:
            print(f"ERROR: Could not remove existing target file {new_path.relative_to(ROOT)}: {e}")
            sys.stdout.flush()
            # Log specific error for debugging
            with open(log_dir / "rename_errors.log", "a", encoding="utf8") as log_file:
                log_file.write(f"[{datetime.now()}] Error removing existing target file {new_path.relative_to(ROOT)}: {e}\n")
                import traceback
                traceback.print_exc(file=log_file)
            return False
    
    try:
        os.rename(file_path, new_path)
        print(f"Renamed {file_path.relative_to(ROOT)} to {new_path.relative_to(ROOT)}")
        sys.stdout.flush()
        return True
    except FileExistsError as e:
        print(f"ERROR: FileExistsError during renaming {file_path.relative_to(ROOT)} to {new_path.relative_to(ROOT)}: {e}")
        sys.stdout.flush()
        with open(log_dir / "rename_errors.log", "a", encoding="utf8") as log_file:
            log_file.write(f"[{datetime.now()}] FileExistsError renaming {file_path.relative_to(ROOT)} to {new_path.relative_to(ROOT)}: {e}\n")
            import traceback
            traceback.print_exc(file=log_file)
        return False
    except PermissionError as e:
        print(f"ERROR: PermissionError during renaming {file_path.relative_to(ROOT)} to {new_path.relative_to(ROOT)}: {e}")
        sys.stdout.flush()
        with open(log_dir / "rename_errors.log", "a", encoding="utf8") as log_file:
            log_file.write(f"[{datetime.now()}] PermissionError renaming {file_path.relative_to(ROOT)} to {new_path.relative_to(ROOT)}: {e}\n")
            import traceback
            traceback.print_exc(file=log_file)
        return False
    except OSError as e:
        print(f"ERROR: OSError during renaming {file_path.relative_to(ROOT)} to {new_path.relative_to(ROOT)}: {e}")
        sys.stdout.flush()
        # Log specific OSError details for debugging
        with open(log_dir / "rename_errors.log", "a", encoding="utf8") as log_file:
            log_file.write(f"[{datetime.now()}] OSError renaming {file_path.relative_to(ROOT)} to {new_path.relative_to(ROOT)}: {e}\n")
            import traceback
            traceback.print_exc(file=log_file)
        return False
    except Exception as e:
        print(f"ERROR: Unexpected error during renaming {file_path.relative_to(ROOT)}: {e}")
        sys.stdout.flush()
        # Log unexpected errors
        with open(log_dir / "rename_errors.log", "a", encoding="utf8") as log_file:
            log_file.write(f"[{datetime.now()}] Unexpected error renaming {file_path.relative_to(ROOT)}: {e}\n")
            import traceback
            traceback.print_exc(file=log_file)
        return False

def clean_corrupted_ts_files(vision: str, model: str):
    print("DEBUG: Checking for and healing corrupted TypeScript files...")
    sys.stdout.flush()
    corrupted_files_to_check = [
        ROOT / "server" / "app.ts",
        ROOT / "server" / "routes.ts"
    ]
    error_pattern = r'\{"error":"[^"]+"\}'
    for file_path in corrupted_files_to_check:
        # Adjust path to be relative to current working directory (TEMP_TEST_ROOT)
        relative_file_path = Path(os.getcwd()) / file_path.relative_to(ROOT)
        if relative_file_path.exists():
            try:
                content = relative_file_path.read_text(encoding="utf8")
                if re.search(error_pattern, content):
                    print(f"WARNING: Detected corruption in {relative_file_path.relative_to(ROOT)}. Attempting to heal.")
                    sys.stdout.flush()
                    # Attempt to heal the corrupted file
                    healing_success = heal_single_file(relative_file_path, vision, model, error_context="Detected corruption pattern.")
                    if healing_success:
                        print(f"DEBUG: Successfully healed {relative_file_path.relative_to(ROOT)}.")
                        sys.stdout.flush()
                    else:
                        print(f"ERROR: Failed to heal {relative_file_path.relative_to(ROOT)}. It might still be corrupted.")
                        sys.stdout.flush()
            except Exception as e:
                print(f"ERROR: Could not check or heal {relative_file_path.relative_to(ROOT)}: {e}")
                sys.stdout.flush()

print("DEBUG: Reached end of script, about to check __name__.")
sys.stdout.flush()

if __name__ == "__main__":
    print("DEBUG: Calling main function...")
    sys.stdout.flush()
    main()
