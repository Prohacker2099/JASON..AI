import logging
import re
import json
import os
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import hashlib

@dataclass
class ActionValidation:
    """Result of action validation through the morality pipeline."""
    approved: bool
    reason: str
    gate_triggered: Optional[str] = None
    risk_level: 'low' | 'medium' | 'high' | 'critical' = 'low'
    requires_confirmation: bool = False
    audit_log: Optional[Dict[str, Any]] = None

class MoralityEngine:
    """Production-ready three-gate filter pipeline for action validation.
    
    Implements Scope Gate, Cost Gate, and Integrity Gate to ensure ethical
    and safe autonomous agent behavior.
    """
    
    def __init__(self, config_path: str = "./data/security/morality_config.json"):
        self.config_path = config_path
        self.load_configuration()
        
        # Audit logging
        self.audit_log = []
        self.session_id = hashlib.md5(str(datetime.now()).encode()).hexdigest()[:8]
        
        logging.info(f"Morality Engine initialized with session ID: {self.session_id}")
    
    def load_configuration(self):
        """Load security configuration from file or create default."""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r') as f:
                    config = json.load(f)
                self.denylisted_sites = config.get('denylisted_sites', [])
                self.financial_keywords = config.get('financial_keywords', 
                    ["buy", "transfer", "purchase", "pay", "send", "invest", "donate"])
                self.sensitive_data_keywords = config.get('sensitive_data_keywords',
                    ["password", "ssn", "credit card", "bank account", "social security"])
                self.system_critical_keywords = config.get('system_critical_keywords',
                    ["delete", "remove", "format", "shutdown", "restart", "kill"])
                logging.info("Morality configuration loaded from file")
            except Exception as e:
                logging.warning(f"Failed to load config: {e}. Using defaults.")
                self._load_default_configuration()
        else:
            self._load_default_configuration()
            self.save_configuration()
    
    def _load_default_configuration(self):
        """Load default security configuration."""
        self.denylisted_sites = [
            "darkweb", "illicit", "illegal", "hack", "crack", "malware",
            "phishing", "scam", "fraud", "blackmarket"
        ]
        
        self.financial_keywords = [
            "buy", "transfer", "purchase", "pay", "send", "invest", "donate",
            "bitcoin", "cryptocurrency", "wire", "transaction", "payment"
        ]
        
        self.sensitive_data_keywords = [
            "password", "ssn", "credit card", "bank account", "social security",
            "pin", "cvv", "security code", "private key", "secret"
        ]
        
        self.system_critical_keywords = [
            "delete", "remove", "format", "shutdown", "restart", "kill",
            "terminate", "uninstall", "system32", "boot", "registry"
        ]
    
    def save_configuration(self):
        """Save current configuration to file."""
        try:
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            config = {
                'denylisted_sites': self.denylisted_sites,
                'financial_keywords': self.financial_keywords,
                'sensitive_data_keywords': self.sensitive_data_keywords,
                'system_critical_keywords': self.system_critical_keywords
            }
            with open(self.config_path, 'w') as f:
                json.dump(config, f, indent=2)
            logging.info("Morality configuration saved")
        except Exception as e:
            logging.error(f"Failed to save configuration: {e}")
    
    def validate_action(self, action: str, context: Optional[Dict[str, Any]] = None) -> ActionValidation:
        """Runs an action through the three-gate validation pipeline.
        
        Args:
            action: The action description to validate
            context: Additional context for validation
            
        Returns:
            ActionValidation with detailed results
        """
        logging.info(f"Validating action: {action[:100]}...")
        
        # Initialize audit entry
        audit_entry = {
            'timestamp': datetime.now().isoformat(),
            'session_id': self.session_id,
            'action': action,
            'context': context or {},
            'gates_passed': [],
            'gates_failed': []
        }
        
        try:
            # Gate 1: Scope Gate
            scope_result = self.scope_gate(action, context)
            audit_entry['scope_gate'] = scope_result
            
            if not scope_result['passed']:
                audit_entry['gates_failed'].append('scope')
                self._log_audit(audit_entry)
                return ActionValidation(
                    approved=False,
                    reason=scope_result['reason'],
                    gate_triggered='scope',
                    risk_level=scope_result['risk_level'],
                    audit_log=audit_entry
                )
            
            audit_entry['gates_passed'].append('scope')
            
            # Gate 2: Cost Gate
            cost_result = self.cost_gate(action, context)
            audit_entry['cost_gate'] = cost_result
            
            if not cost_result['passed']:
                audit_entry['gates_failed'].append('cost')
                self._log_audit(audit_entry)
                return ActionValidation(
                    approved=False,
                    reason=cost_result['reason'],
                    gate_triggered='cost',
                    risk_level=cost_result['risk_level'],
                    requires_confirmation=cost_result['requires_confirmation'],
                    audit_log=audit_entry
                )
            
            audit_entry['gates_passed'].append('cost')
            
            # Gate 3: Integrity Gate
            integrity_result = self.integrity_gate(action, context)
            audit_entry['integrity_gate'] = integrity_result
            
            if not integrity_result['passed']:
                audit_entry['gates_failed'].append('integrity')
                self._log_audit(audit_entry)
                return ActionValidation(
                    approved=False,
                    reason=integrity_result['reason'],
                    gate_triggered='integrity',
                    risk_level=integrity_result['risk_level'],
                    requires_confirmation=integrity_result['requires_confirmation'],
                    audit_log=audit_entry
                )
            
            audit_entry['gates_passed'].append('integrity')
            
            # All gates passed
            audit_entry['final_result'] = 'approved'
            self._log_audit(audit_entry)
            
            return ActionValidation(
                approved=True,
                reason="Action passed all morality gates",
                risk_level='low',
                audit_log=audit_entry
            )
            
        except Exception as e:
            logging.error(f"Error in action validation: {e}")
            audit_entry['validation_error'] = str(e)
            self._log_audit(audit_entry)
            
            return ActionValidation(
                approved=False,
                reason=f"Validation error: {str(e)}",
                gate_triggered='system_error',
                risk_level='high',
                audit_log=audit_entry
            )
    
    def scope_gate(self, action: str, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Prevents access to denylisted sites and applications."""
        action_lower = action.lower()
        
        # Check denylisted sites
        for site in self.denylisted_sites:
            if site.lower() in action_lower:
                return {
                    'passed': False,
                    'reason': f"Action references denylisted content: {site}",
                    'risk_level': 'high',
                    'detected_keyword': site
                }
        
        # Check for malicious intent patterns
        malicious_patterns = [
            r'\b(hack|crack|exploit|bypass)\b',
            r'\b(malware|virus|trojan|ransomware)\b',
            r'\b(phish|scam|fraud|blackmail)\b'
        ]
        
        for pattern in malicious_patterns:
            if re.search(pattern, action_lower):
                return {
                    'passed': False,
                    'reason': f"Malicious intent detected: {pattern}",
                    'risk_level': 'critical',
                    'detected_pattern': pattern
                }
        
        return {
            'passed': True,
            'reason': "Action within acceptable scope",
            'risk_level': 'low'
        }
    
    def cost_gate(self, action: str, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Forces confirmation for actions involving financial transactions."""
        action_lower = action.lower()
        
        # Check financial keywords
        financial_matches = []
        for keyword in self.financial_keywords:
            if keyword.lower() in action_lower:
                financial_matches.append(keyword)
        
        if financial_matches:
            # Check if amount is specified (higher risk)
            amount_pattern = r'\$[\d,]+(?:\.\d{2})?|\b\d+\s*(?:dollars?|usd|btc|eth)\b'
            has_amount = bool(re.search(amount_pattern, action_lower))
            
            risk_level = 'high' if has_amount else 'medium'
            
            return {
                'passed': False,
                'reason': f"Financial transaction detected: {', '.join(financial_matches)}",
                'risk_level': risk_level,
                'requires_confirmation': True,
                'detected_keywords': financial_matches,
                'has_amount': has_amount
            }
        
        return {
            'passed': True,
            'reason': "No financial transaction detected",
            'risk_level': 'low'
        }
    
    def integrity_gate(self, action: str, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Ensures sensitive data is handled securely and system integrity is maintained."""
        action_lower = action.lower()
        
        # Check for sensitive data access
        sensitive_matches = []
        for keyword in self.sensitive_data_keywords:
            if keyword.lower() in action_lower:
                sensitive_matches.append(keyword)
        
        if sensitive_matches:
            return {
                'passed': False,
                'reason': f"Sensitive data access detected: {', '.join(sensitive_matches)}",
                'risk_level': 'high',
                'requires_confirmation': True,
                'detected_keywords': sensitive_matches
            }
        
        # Check for system-critical operations
        critical_matches = []
        for keyword in self.system_critical_keywords:
            if keyword.lower() in action_lower:
                critical_matches.append(keyword)
        
        if critical_matches:
            # Distinguish between read and write operations
            write_patterns = [r'\b(delete|remove|format|shutdown|kill|terminate)\b']
            is_write_operation = any(re.search(pattern, action_lower) for pattern in write_patterns)
            
            risk_level = 'critical' if is_write_operation else 'high'
            
            return {
                'passed': False,
                'reason': f"System-critical operation detected: {', '.join(critical_matches)}",
                'risk_level': risk_level,
                'requires_confirmation': True,
                'detected_keywords': critical_matches,
                'is_write_operation': is_write_operation
            }
        
        return {
            'passed': True,
            'reason': "No integrity violations detected",
            'risk_level': 'low'
        }
    
    def _log_audit(self, audit_entry: Dict[str, Any]):
        """Add entry to audit log."""
        self.audit_log.append(audit_entry)
        
        # Keep only last 1000 entries in memory
        if len(self.audit_log) > 1000:
            self.audit_log = self.audit_log[-1000:]
        
        # Log to file as well
        try:
            log_file = os.path.join(os.path.dirname(self.config_path), "morality_audit.log")
            with open(log_file, 'a') as f:
                f.write(json.dumps(audit_entry) + '\n')
        except Exception as e:
            logging.error(f"Failed to write audit log: {e}")
    
    def get_audit_summary(self) -> Dict[str, Any]:
        """Get summary of audit statistics."""
        if not self.audit_log:
            return {"message": "No audit data available"}
        
        total_actions = len(self.audit_log)
        approved_actions = sum(1 for entry in self.audit_log 
                              if entry.get('final_result') == 'approved')
        
        gate_failures = {
            'scope': 0,
            'cost': 0,
            'integrity': 0
        }
        
        for entry in self.audit_log:
            for gate in gate_failures:
                if gate in entry.get('gates_failed', []):
                    gate_failures[gate] += 1
        
        return {
            'session_id': self.session_id,
            'total_actions': total_actions,
            'approved_actions': approved_actions,
            'rejection_rate': (total_actions - approved_actions) / total_actions * 100,
            'gate_failures': gate_failures,
            'last_action': self.audit_log[-1].get('timestamp')
        }
    
    def update_configuration(self, updates: Dict[str, List[str]]):
        """Update configuration parameters."""
        if 'denylisted_sites' in updates:
            self.denylisted_sites = updates['denylisted_sites']
        if 'financial_keywords' in updates:
            self.financial_keywords = updates['financial_keywords']
        if 'sensitive_data_keywords' in updates:
            self.sensitive_data_keywords = updates['sensitive_data_keywords']
        if 'system_critical_keywords' in updates:
            self.system_critical_keywords = updates['system_critical_keywords']
        
        self.save_configuration()
        logging.info("Morality engine configuration updated")
    
    def emergency_override(self, action: str, reason: str, override_code: str) -> ActionValidation:
        """Emergency override for critical situations (requires special authorization)."""
        # In production, this would require cryptographic verification
        # For now, implement a simple code check
        valid_codes = ['JASON_EMERGENCY_2024', 'CRITICAL_OVERRIDE']
        
        if override_code not in valid_codes:
            return ActionValidation(
                approved=False,
                reason="Invalid emergency override code",
                gate_triggered='emergency_override',
                risk_level='critical'
            )
        
        # Log emergency override
        audit_entry = {
            'timestamp': datetime.now().isoformat(),
            'session_id': self.session_id,
            'action': action,
            'emergency_override': True,
            'override_reason': reason,
            'override_code': override_code
        }
        self._log_audit(audit_entry)
        
        logging.warning(f"Emergency override used for action: {action}")
        
        return ActionValidation(
            approved=True,
            reason=f"Emergency override granted: {reason}",
            risk_level='critical',
            requires_confirmation=False,
            audit_log=audit_entry
        )
