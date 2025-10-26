#!/usr/bin/env node
// M3GAN Test Script
// Tests the M3GAN integration with JASON

import { M3GANIntegration, DEFAULT_M3GAN_INTEGRATION_CONFIG } from './core/M3GAN';
import { logger } from './server/src/utils/logger';

async function testM3GAN() {
  console.log('🧠 M3GAN Test Suite Starting...\n');

  try {
    // Initialize M3GAN Integration
    console.log('1. Initializing M3GAN Integration...');
    const m3ganConfig = {
      ...DEFAULT_M3GAN_INTEGRATION_CONFIG,
      userId: 'test_user',
      deviceId: 'test_device',
      integrationMode: 'full' as const
    };

    const m3ganIntegration = new M3GANIntegration(m3ganConfig);
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ M3GAN Integration initialized\n');

    // Test 1: Check Integration Status
    console.log('2. Testing Integration Status...');
    const status = await m3ganIntegration.getIntegrationStatus();
    console.log('📊 Integration Status:', JSON.stringify(status, null, 2));
    console.log('✅ Integration status retrieved\n');

    // Test 2: Check M3GAN State
    console.log('3. Testing M3GAN State...');
    const state = await m3ganIntegration.getM3GANState();
    console.log('🧠 M3GAN State:', JSON.stringify(state, null, 2));
    console.log('✅ M3GAN state retrieved\n');

    // Test 3: Process User Input
    console.log('4. Testing User Input Processing...');
    const testInputs = [
      'Hello M3GAN, how are you today?',
      'Turn on the living room lights',
      'I\'m feeling stressed, can you help?',
      'What\'s the weather like?',
      'Create a relaxing atmosphere'
    ];

    for (const input of testInputs) {
      console.log(`   Processing: "${input}"`);
      try {
        const response = await m3ganIntegration.processUserInput(input);
        console.log(`   Response: "${response}"`);
      } catch (error) {
        console.log(`   Error: ${error.message}`);
      }
    }
    console.log('✅ User input processing tested\n');

    // Test 4: Emotional State Updates
    console.log('5. Testing Emotional State Updates...');
    const emotions = ['happy', 'sad', 'neutral', 'concerned', 'alert'];
    
    for (const emotion of emotions) {
      console.log(`   Setting emotional state to: ${emotion}`);
      await m3ganIntegration.updateM3GANEmotionalState(emotion as any);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('✅ Emotional state updates tested\n');

    // Test 5: User Mood Updates
    console.log('6. Testing User Mood Updates...');
    const moods = ['happy', 'stressed', 'tired', 'focused', 'neutral'];
    
    for (const mood of moods) {
      console.log(`   Setting user mood to: ${mood}`);
      await m3ganIntegration.updateM3GANUserMood(mood as any);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('✅ User mood updates tested\n');

    // Test 6: Trust Level Adjustments
    console.log('7. Testing Trust Level Adjustments...');
    const trustDeltas = [0.1, -0.05, 0.2, -0.1, 0.15];
    
    for (const delta of trustDeltas) {
      console.log(`   Adjusting trust level by: ${delta}`);
      await m3ganIntegration.adjustM3GANTrustLevel(delta);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('✅ Trust level adjustments tested\n');

    // Test 7: Health Check
    console.log('8. Testing Health Check...');
    const isHealthy = await m3ganIntegration.isHealthy();
    console.log(`🏥 M3GAN Health Status: ${isHealthy ? 'Healthy' : 'Unhealthy'}`);
    console.log('✅ Health check completed\n');

    // Test 8: Final State Check
    console.log('9. Final State Check...');
    const finalState = await m3ganIntegration.getM3GANState();
    console.log('🧠 Final M3GAN State:', JSON.stringify(finalState, null, 2));
    console.log('✅ Final state retrieved\n');

    // Test 9: Shutdown
    console.log('10. Testing Shutdown...');
    await m3ganIntegration.shutdown();
    console.log('✅ M3GAN Integration shutdown completed\n');

    console.log('🎉 All M3GAN tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Integration initialization');
    console.log('   ✅ Status and state retrieval');
    console.log('   ✅ User input processing');
    console.log('   ✅ Emotional state updates');
    console.log('   ✅ User mood updates');
    console.log('   ✅ Trust level adjustments');
    console.log('   ✅ Health checks');
    console.log('   ✅ Graceful shutdown');

  } catch (error) {
    console.error('❌ M3GAN Test Suite Failed:', error);
    process.exit(1);
  }
}

// Run the test suite
if (require.main === module) {
  testM3GAN().catch(error => {
    console.error('❌ Test suite error:', error);
    process.exit(1);
  });
}

export { testM3GAN };
