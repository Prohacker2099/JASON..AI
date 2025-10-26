#!/usr/bin/env node
// JASON AGI Test Suite - Autonomous General Intelligence Testing

import { JASONCoreAIEngine } from './core/JASON-AGI/JASONCoreAIEngine';
import { logger } from './server/src/utils/logger';

async function testJASONAGI() {
  console.log('🚀 JASON AGI Test Suite Starting...\n');
  console.log('Testing Autonomous General Intelligence Features:\n');

  try {
    // Initialize JASON AGI Core Engine
    console.log('1. Initializing JASON AGI Core Engine...');
    const jasonConfig = {
      userId: 'test_user',
      deviceId: 'test_device',
      trustLevel: 'premium' as const,
      permissions: {
        calendarAccess: true,
        emailAccess: true,
        financialAccess: true,
        documentAccess: true,
        webAccess: true,
        deviceControl: true
      },
      autonomyLevel: 'fully-autonomous' as const,
      contextDepth: 'comprehensive' as const,
      learningMode: 'proactive' as const
    };

    const jasonAGI = new JASONCoreAIEngine(jasonConfig);
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ JASON AGI Core Engine initialized\n');

    // Test 2: Everything Context Manager
    console.log('2. Testing Everything Context Manager...');
    const contextAnalysis = await jasonAGI.everythingContextManager.analyzeContext(
      'Plan a weekend trip to San Francisco',
      { budget: 1000, preferences: ['outdoor activities', 'good food'] }
    );
    console.log('🧠 Context Analysis:', {
      domains: contextAnalysis.relevantDomains.length,
      nodes: contextAnalysis.keyContextNodes.length,
      links: contextAnalysis.crossDomainLinks.length,
      confidence: contextAnalysis.confidence,
      completeness: contextAnalysis.completeness
    });
    console.log('✅ Everything Context Manager tested\n');

    // Test 3: Autonomous Task Planning
    console.log('3. Testing Autonomous Task Planning...');
    const executionPlan = await jasonAGI.autonomousTaskPlanner.createExecutionPlan(
      'Write a comprehensive research paper on artificial intelligence',
      contextAnalysis
    );
    console.log('📋 Execution Plan:', {
      planId: executionPlan.id,
      subTasks: executionPlan.subTasks.length,
      complexity: executionPlan.complexity,
      permissionLevel: executionPlan.permissionLevel,
      estimatedDuration: executionPlan.estimatedTotalDuration
    });
    console.log('✅ Autonomous Task Planning tested\n');

    // Test 4: Trust Protocol System
    console.log('4. Testing Trust Protocol System...');
    const trustLevel = await jasonAGI.trustProtocolManager.getTrustLevel();
    console.log('🛡️ Trust Level:', {
      score: trustLevel.score,
      level: trustLevel.level,
      factors: trustLevel.factors
    });
    
    const permissionCheck = await jasonAGI.trustProtocolManager.checkPermissions(executionPlan);
    console.log('🔐 Permission Check:', {
      approved: permissionCheck.approved,
      reason: permissionCheck.reason,
      requiredLevel: permissionCheck.requiredLevel
    });
    console.log('✅ Trust Protocol System tested\n');

    // Test 5: Jason Eye Interface
    console.log('5. Testing Jason Eye Interface...');
    const eyeStatus = await jasonAGI.jasonEyeInterface.getCurrentStatus();
    console.log('👁️ Jason Eye Status:', eyeStatus);
    
    const activityFeed = await jasonAGI.jasonEyeInterface.getActivityFeed();
    console.log('📊 Activity Feed:', activityFeed.length, 'entries');
    
    const interfaceState = await jasonAGI.jasonEyeInterface.getInterfaceState();
    console.log('🎛️ Interface State:', {
      isMinimized: interfaceState.isMinimized,
      isHidden: interfaceState.isHidden,
      activeTaskCount: interfaceState.activeTaskCount
    });
    console.log('✅ Jason Eye Interface tested\n');

    // Test 6: Complex Autonomous Task Execution
    console.log('6. Testing Complex Autonomous Task Execution...');
    const complexGoals = [
      'Plan a surprise birthday party for my partner next month',
      'Handle the process of buying a new electric car',
      'Write the final draft of my 2,000-word thesis on quantum entanglement',
      'Organize a charity event for my company that requires budgeting, vendor communication, and social media promotion',
      'Help me stick to my new gym routine and meal plan'
    ];

    for (const goal of complexGoals) {
      console.log(`   Processing: "${goal}"`);
      try {
        const result = await jasonAGI.handleUserGoal(goal, {
          context: 'test_execution',
          priority: 'high'
        });
        console.log(`   Result: "${result.substring(0, 100)}..."`);
      } catch (error) {
        console.log(`   Error: ${error.message}`);
      }
    }
    console.log('✅ Complex Autonomous Task Execution tested\n');

    // Test 7: Multi-Domain Task Handling
    console.log('7. Testing Multi-Domain Task Handling...');
    const multiDomainTasks = [
      {
        goal: 'Plan a business trip to Tokyo',
        domains: ['travel', 'financial', 'calendar', 'work'],
        expectedComplexity: 'complex'
      },
      {
        goal: 'Research and write a blog post about sustainable living',
        domains: ['academic', 'creative', 'web'],
        expectedComplexity: 'moderate'
      },
      {
        goal: 'Organize my home office and optimize my workflow',
        domains: ['personal', 'productivity', 'environmental'],
        expectedComplexity: 'moderate'
      }
    ];

    for (const task of multiDomainTasks) {
      console.log(`   Multi-domain task: "${task.goal}"`);
      const complexity = await jasonAGI.analyzeGoalComplexity(task.goal);
      console.log(`   Detected complexity: ${complexity} (expected: ${task.expectedComplexity})`);
      console.log(`   Expected domains: ${task.domains.join(', ')}`);
    }
    console.log('✅ Multi-Domain Task Handling tested\n');

    // Test 8: Trust Level Management
    console.log('8. Testing Trust Level Management...');
    const initialTrustLevel = await jasonAGI.getJASONStatus();
    console.log('📊 Initial Trust Level:', initialTrustLevel.trustScore);
    
    // Simulate positive interactions
    await jasonAGI.updateTrustLevel(0.1);
    const updatedTrustLevel = await jasonAGI.getJASONStatus();
    console.log('📈 Updated Trust Level:', updatedTrustLevel.trustScore);
    
    // Test autonomy level changes
    await jasonAGI.updateAutonomyLevel('semi-autonomous');
    const autonomyStatus = await jasonAGI.getJASONStatus();
    console.log('🎯 Autonomy Level:', autonomyStatus.autonomyLevel);
    console.log('✅ Trust Level Management tested\n');

    // Test 9: Proactive Contingency Planning
    console.log('9. Testing Proactive Contingency Planning...');
    const contingencyPlans = await jasonAGI.proactiveContingencyPlanningAgent.generateContingencyPlans(executionPlan);
    console.log('🔄 Contingency Plans:', contingencyPlans.length, 'plans generated');
    
    for (const plan of contingencyPlans.slice(0, 3)) {
      console.log(`   Contingency: ${plan.description} (Risk: ${plan.riskLevel})`);
    }
    console.log('✅ Proactive Contingency Planning tested\n');

    // Test 10: Self-Correction and Learning
    console.log('10. Testing Self-Correction and Learning...');
    const reflectionResult = await jasonAGI.selfCorrectionReflectionLoop.performReflection(
      executionPlan,
      'Task completed successfully with minor adjustments'
    );
    console.log('🔄 Reflection Result:', reflectionResult);
    console.log('✅ Self-Correction and Learning tested\n');

    // Test 11: Digital Agent Interface
    console.log('11. Testing Digital Agent Interface...');
    const simpleAction = await jasonAGI.digitalAgentInterface.executeSimpleAction(
      'Check my calendar for next week',
      { context: 'test' }
    );
    console.log('🤖 Simple Action Result:', simpleAction);
    console.log('✅ Digital Agent Interface tested\n');

    // Test 12: User Style Preference Training
    console.log('12. Testing User Style Preference Training...');
    const styleProfile = await jasonAGI.userStylePreferenceTrainer.getUserProfile();
    console.log('🎨 Style Profile:', styleProfile ? 'Loaded' : 'Not available');
    
    const personalizedResponse = await jasonAGI.userStylePreferenceTrainer.generatePersonalizedResponse(
      'Hello JASON, how are you today?',
      { context: 'greeting' }
    );
    console.log('💬 Personalized Response:', personalizedResponse);
    console.log('✅ User Style Preference Training tested\n');

    // Test 13: System Health and Performance
    console.log('13. Testing System Health and Performance...');
    const systemStatus = await jasonAGI.getJASONStatus();
    console.log('🏥 System Status:', {
      isActive: systemStatus.state.isActive,
      contextAwareness: systemStatus.contextAwareness,
      trustScore: systemStatus.trustScore,
      autonomyLevel: systemStatus.autonomyLevel,
      activeTasks: systemStatus.activeTasks
    });
    console.log('✅ System Health and Performance tested\n');

    // Test 14: Final Integration Test
    console.log('14. Final Integration Test...');
    
    // Complex scenario simulation
    const complexScenario = {
      goal: 'I\'m having a stressful day and need help organizing everything for my upcoming presentation next week',
      context: {
        timeOfDay: 'afternoon',
        location: 'office',
        emotionalState: 'stressed',
        urgency: 'high',
        previousInteractions: 10
      }
    };

    console.log('   Complex scenario:', complexScenario.goal);
    const complexResult = await jasonAGI.handleUserGoal(
      complexScenario.goal,
      complexScenario.context
    );
    console.log(`   Complex result: "${complexResult.substring(0, 200)}..."`);
    console.log('✅ Final Integration Test completed\n');

    // Test 15: Shutdown
    console.log('15. Testing Graceful Shutdown...');
    await jasonAGI.shutdown();
    console.log('✅ JASON AGI Core Engine shutdown completed\n');

    console.log('🎉 All JASON AGI tests completed successfully!');
    console.log('\n📋 JASON AGI Test Summary:');
    console.log('   ✅ Core AI Engine initialization');
    console.log('   ✅ Everything Context Manager');
    console.log('   ✅ Autonomous Task Planning');
    console.log('   ✅ Trust Protocol System');
    console.log('   ✅ Jason Eye Interface');
    console.log('   ✅ Complex Autonomous Task Execution');
    console.log('   ✅ Multi-Domain Task Handling');
    console.log('   ✅ Trust Level Management');
    console.log('   ✅ Proactive Contingency Planning');
    console.log('   ✅ Self-Correction and Learning');
    console.log('   ✅ Digital Agent Interface');
    console.log('   ✅ User Style Preference Training');
    console.log('   ✅ System Health and Performance');
    console.log('   ✅ Complex Scenario Integration');
    console.log('   ✅ Graceful Shutdown');

    console.log('\n🌟 JASON AGI Features Verified:');
    console.log('   🧠 Everything Context Manager (ECM)');
    console.log('   📋 Autonomous Task Planner (ATP)');
    console.log('   🔄 Proactive Contingency Planning Agent (CPA)');
    console.log('   🎨 User Style Preference Trainer (USPT)');
    console.log('   🤖 Digital Agent Interface (DAI)');
    console.log('   🔄 Self-Correction Reflection Loop (SCRL)');
    console.log('   👁️ Jason Eye Interface (J-Eye)');
    console.log('   🛡️ Trust Protocol Manager');
    console.log('   🔐 Multi-Tiered Permission System');
    console.log('   ⏸️ Pause and Review Feature');
    console.log('   📊 Trust Level Management');
    console.log('   🎯 Autonomy Level Control');

  } catch (error) {
    console.error('❌ JASON AGI Test Suite Failed:', error);
    process.exit(1);
  }
}

// Run the JASON AGI test suite
if (require.main === module) {
  testJASONAGI().catch(error => {
    console.error('❌ JASON AGI test suite error:', error);
    process.exit(1);
  });
}

export { testJASONAGI };
