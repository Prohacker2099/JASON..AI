// Simple test script to verify TypeScript execution
console.log('Hello, world! Start of script');

// Test basic async/await
async function testAsync() {
  console.log('Inside async function');
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('Async operation completed');
  return 'Success';
}

// Run the test
console.log('Before async call');
testAsync()
  .then(result => {
    console.log('Async result:', result);
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });

console.log('After async call (this should appear before async completes)');
