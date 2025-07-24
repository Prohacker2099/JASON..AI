"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var tabs_1 = require("../components/ui/tabs");
var accordion_1 = require("../components/ui/accordion");
var progress_1 = require("../components/ui/progress");
var card_1 = require("../components/ui/card");
var badge_1 = require("../components/ui/badge");
var RoadmapProgressPanel_1 = require("../components/RoadmapProgressPanel");
var Roadmap = function () {
  var _a = (0, react_1.useState)("phase1"),
    activePhase = _a[0],
    setActivePhase = _a[1];
  // Implementation progress tracking
  var progressData = {
    deviceIntegration: {
      phase1: 65,
      phase2: 30,
      phase3: 10,
      phase4: 5,
    },
    aiLearning: {
      phase1: 70,
      phase2: 25,
      phase3: 10,
      phase4: 0,
    },
    dataDividend: {
      phase1: 50,
      phase2: 15,
      phase3: 0,
      phase4: 0,
    },
    developerMarketplace: {
      phase1: 40,
      phase2: 10,
      phase3: 0,
      phase4: 0,
    },
    hardwareHub: {
      phase1: 30,
      phase2: 5,
      phase3: 0,
      phase4: 0,
    },
  };
  var getStatusBadge = function (progress) {
    if (progress === 100)
      return <badge_1.Badge className="bg-green-500">Completed</badge_1.Badge>;
    if (progress > 0)
      return (
        <badge_1.Badge className="bg-amber-500">In Progress</badge_1.Badge>
      );
    return <badge_1.Badge className="bg-slate-500">Planned</badge_1.Badge>;
  };
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">
          JASON Implementation Roadmap
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Our strategic plan for expanding JASON's capabilities across five key
          areas over a 24-month period.
        </p>
      </div>

      <div className="mb-8">
        <RoadmapProgressPanel_1.default />
      </div>

      <tabs_1.Tabs
        defaultValue="phase1"
        value={activePhase}
        onValueChange={setActivePhase}
        className="w-full"
      >
        <tabs_1.TabsList className="grid grid-cols-4 mb-8">
          <tabs_1.TabsTrigger value="phase1">
            Phase 1: Foundation
            <br />
            (Months 1-6)
          </tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="phase2">
            Phase 2: Development
            <br />
            (Months 7-12)
          </tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="phase3">
            Phase 3: Launch
            <br />
            (Months 13-18)
          </tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="phase4">
            Phase 4: Expansion
            <br />
            (Months 19-24)
          </tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        {["phase1", "phase2", "phase3", "phase4"].map(
          function (phase, phaseIndex) {
            return (
              <tabs_1.TabsContent
                value={phase}
                key={phase}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Device Integration Expansion */}
                  <card_1.Card className="bg-gray-800/50 border-gray-700">
                    <card_1.CardHeader>
                      <div className="flex justify-between items-center">
                        <card_1.CardTitle>
                          Device Integration Expansion
                        </card_1.CardTitle>
                        {getStatusBadge(progressData.deviceIntegration[phase])}
                      </div>
                      <card_1.CardDescription>
                        Extending support to a comprehensive range of smart home
                        protocols and devices
                      </card_1.CardDescription>
                      <progress_1.Progress
                        value={progressData.deviceIntegration[phase]}
                        className="h-2 mt-2"
                      />
                    </card_1.CardHeader>
                    <card_1.CardContent>
                      <accordion_1.Accordion
                        type="single"
                        collapsible
                        className="w-full"
                      >
                        <accordion_1.AccordionItem value="objectives">
                          <accordion_1.AccordionTrigger>
                            Objectives
                          </accordion_1.AccordionTrigger>
                          <accordion_1.AccordionContent>
                            <ul className="list-disc pl-5 space-y-1">
                              {phaseIndex === 0 && (
                                <>
                                  <li>
                                    Implement direct API integrations for top 10
                                    smart home ecosystems
                                  </li>
                                  <li>
                                    Enhance Matter/Thread support to full
                                    controller capabilities
                                  </li>
                                  <li>
                                    Develop comprehensive device type handlers
                                    for all major categories
                                  </li>
                                  <li>
                                    Improve discovery mechanisms for local
                                    network devices
                                  </li>
                                </>
                              )}
                              {phaseIndex === 1 && (
                                <>
                                  <li>Expand to 20+ direct API integrations</li>
                                  <li>
                                    Implement HomeKit bridge functionality
                                  </li>
                                  <li>
                                    Develop advanced media and entertainment
                                    control
                                  </li>
                                  <li>
                                    Create energy management device integrations
                                  </li>
                                </>
                              )}
                              {phaseIndex === 2 && (
                                <>
                                  <li>Expand to 30+ direct integrations</li>
                                  <li>
                                    Implement specialized protocols (KNX,
                                    Modbus, etc.)
                                  </li>
                                  <li>
                                    Develop vehicle and mobility integrations
                                  </li>
                                  <li>
                                    Create advanced multi-protocol bridging
                                  </li>
                                </>
                              )}
                              {phaseIndex === 3 && (
                                <>
                                  <li>
                                    Achieve comprehensive coverage of all major
                                    device categories
                                  </li>
                                  <li>
                                    Implement industrial and commercial
                                    integrations
                                  </li>
                                  <li>
                                    Develop predictive maintenance capabilities
                                  </li>
                                  <li>
                                    Create advanced diagnostics and
                                    troubleshooting
                                  </li>
                                </>
                              )}
                            </ul>
                          </accordion_1.AccordionContent>
                        </accordion_1.AccordionItem>
                        <accordion_1.AccordionItem value="deliverables">
                          <accordion_1.AccordionTrigger>
                            Key Deliverables
                          </accordion_1.AccordionTrigger>
                          <accordion_1.AccordionContent>
                            <ul className="list-disc pl-5 space-y-1">
                              {phaseIndex === 0 && (
                                <>
                                  <li>
                                    Philips Hue, LIFX, and Belkin WeMo direct
                                    integrations
                                  </li>
                                  <li>
                                    Enhanced Matter controller implementation
                                  </li>
                                  <li>
                                    Expanded device type library with
                                    standardized capabilities
                                  </li>
                                  <li>
                                    Improved network discovery using mDNS, SSDP,
                                    and direct scanning
                                  </li>
                                </>
                              )}
                              {phaseIndex === 1 && (
                                <>
                                  <li>
                                    Next tier of ecosystem integrations (Nest,
                                    Ring, etc.)
                                  </li>
                                  <li>
                                    HomeKit Accessory Protocol server
                                    implementation
                                  </li>
                                  <li>
                                    Media control for popular platforms (Sonos,
                                    Spotify, etc.)
                                  </li>
                                  <li>
                                    Energy management for solar, batteries, and
                                    smart meters
                                  </li>
                                </>
                              )}
                              {phaseIndex === 2 && (
                                <>
                                  <li>
                                    Specialized protocol adapters for
                                    professional systems
                                  </li>
                                  <li>
                                    Vehicle API integrations (Tesla, other EVs)
                                  </li>
                                  <li>
                                    Enhanced protocol translation and bridging
                                  </li>
                                  <li>
                                    Legacy device support for discontinued
                                    systems
                                  </li>
                                </>
                              )}
                              {phaseIndex === 3 && (
                                <>
                                  <li>
                                    Integration with industrial control systems
                                  </li>
                                  <li>
                                    Commercial building management interfaces
                                  </li>
                                  <li>
                                    Predictive maintenance algorithms for
                                    supported devices
                                  </li>
                                  <li>
                                    Advanced diagnostic tools for integration
                                    issues
                                  </li>
                                </>
                              )}
                            </ul>
                          </accordion_1.AccordionContent>
                        </accordion_1.AccordionItem>
                      </accordion_1.Accordion>
                    </card_1.CardContent>
                  </card_1.Card>

                  {/* AI Learning Engine Enhancement */}
                  <card_1.Card className="bg-gray-800/50 border-gray-700">
                    <card_1.CardHeader>
                      <div className="flex justify-between items-center">
                        <card_1.CardTitle>
                          AI Learning Engine Enhancement
                        </card_1.CardTitle>
                        {getStatusBadge(progressData.aiLearning[phase])}
                      </div>
                      <card_1.CardDescription>
                        Developing sophisticated pattern recognition and
                        predictive capabilities
                      </card_1.CardDescription>
                      <progress_1.Progress
                        value={progressData.aiLearning[phase]}
                        className="h-2 mt-2"
                      />
                    </card_1.CardHeader>
                    <card_1.CardContent>
                      <accordion_1.Accordion
                        type="single"
                        collapsible
                        className="w-full"
                      >
                        <accordion_1.AccordionItem value="objectives">
                          <accordion_1.AccordionTrigger>
                            Objectives
                          </accordion_1.AccordionTrigger>
                          <accordion_1.AccordionContent>
                            <ul className="list-disc pl-5 space-y-1">
                              {phaseIndex === 0 && (
                                <>
                                  <li>
                                    Implement advanced temporal pattern
                                    recognition
                                  </li>
                                  <li>
                                    Develop multi-modal context fusion
                                    capabilities
                                  </li>
                                  <li>
                                    Create initial behavioral clustering
                                    algorithms
                                  </li>
                                  <li>
                                    Build foundation for predictive models
                                  </li>
                                </>
                              )}
                              {phaseIndex === 1 && (
                                <>
                                  <li>
                                    Implement multi-user preference learning
                                  </li>
                                  <li>
                                    Develop environmental understanding
                                    enhancements
                                  </li>
                                  <li>
                                    Create scene and routine generation
                                    capabilities
                                  </li>
                                  <li>Build explainable AI implementation</li>
                                </>
                              )}
                              {phaseIndex === 2 && (
                                <>
                                  <li>
                                    Implement wellness and lifestyle
                                    intelligence
                                  </li>
                                  <li>
                                    Develop advanced social and multi-user
                                    capabilities
                                  </li>
                                  <li>
                                    Create simulation and scenario planning
                                  </li>
                                  <li>
                                    Build federated learning across JASON
                                    instances
                                  </li>
                                </>
                              )}
                              {phaseIndex === 3 && (
                                <>
                                  <li>Implement advanced causal inference</li>
                                  <li>
                                    Develop comprehensive digital twin
                                    capabilities
                                  </li>
                                  <li>
                                    Create cross-household pattern recognition
                                  </li>
                                  <li>
                                    Build advanced anomaly detection and
                                    prevention
                                  </li>
                                </>
                              )}
                            </ul>
                          </accordion_1.AccordionContent>
                        </accordion_1.AccordionItem>
                        <accordion_1.AccordionItem value="deliverables">
                          <accordion_1.AccordionTrigger>
                            Key Deliverables
                          </accordion_1.AccordionTrigger>
                          <accordion_1.AccordionContent>
                            <ul className="list-disc pl-5 space-y-1">
                              {phaseIndex === 0 && (
                                <>
                                  <li>
                                    Time-series analysis engine using LSTM
                                    networks
                                  </li>
                                  <li>
                                    Context fusion framework for combining
                                    sensor data
                                  </li>
                                  <li>
                                    Unsupervised learning system for behavioral
                                    pattern identification
                                  </li>
                                  <li>
                                    Initial predictive occupancy and device
                                    usage models
                                  </li>
                                </>
                              )}
                              {phaseIndex === 1 && (
                                <>
                                  <li>
                                    Preference learning system with multi-user
                                    support
                                  </li>
                                  <li>Advanced environmental context engine</li>
                                  <li>
                                    Automated scene mining and suggestion system
                                  </li>
                                  <li>
                                    User-friendly explanation generation for AI
                                    decisions
                                  </li>
                                </>
                              )}
                              {phaseIndex === 2 && (
                                <>
                                  <li>
                                    Sleep and wellness optimization features
                                  </li>
                                  <li>
                                    Household dynamics modeling with preference
                                    balancing
                                  </li>
                                  <li>
                                    Simulation environment for automation
                                    testing
                                  </li>
                                  <li>
                                    Privacy-preserving federated learning system
                                  </li>
                                </>
                              )}
                              {phaseIndex === 3 && (
                                <>
                                  <li>
                                    Causal inference engine for complex
                                    automation
                                  </li>
                                  <li>
                                    Digital twin system for simulation and
                                    optimization
                                  </li>
                                  <li>
                                    Privacy-preserving cross-household learning
                                  </li>
                                  <li>
                                    Proactive anomaly detection and mitigation
                                  </li>
                                </>
                              )}
                            </ul>
                          </accordion_1.AccordionContent>
                        </accordion_1.AccordionItem>
                      </accordion_1.Accordion>
                    </card_1.CardContent>
                  </card_1.Card>

                  {/* Data Dividend Framework */}
                  <card_1.Card className="bg-gray-800/50 border-gray-700">
                    <card_1.CardHeader>
                      <div className="flex justify-between items-center">
                        <card_1.CardTitle>
                          Data Dividend Framework
                        </card_1.CardTitle>
                        {getStatusBadge(progressData.dataDividend[phase])}
                      </div>
                      <card_1.CardDescription>
                        Creating an ethical system for user data ownership and
                        monetization
                      </card_1.CardDescription>
                      <progress_1.Progress
                        value={progressData.dataDividend[phase]}
                        className="h-2 mt-2"
                      />
                    </card_1.CardHeader>
                    <card_1.CardContent>
                      <accordion_1.Accordion
                        type="single"
                        collapsible
                        className="w-full"
                      >
                        <accordion_1.AccordionItem value="objectives">
                          <accordion_1.AccordionTrigger>
                            Objectives
                          </accordion_1.AccordionTrigger>
                          <accordion_1.AccordionContent>
                            <ul className="list-disc pl-5 space-y-1">
                              {phaseIndex === 0 && (
                                <>
                                  <li>
                                    Design data classification and valuation
                                    methodology
                                  </li>
                                  <li>
                                    Develop privacy-preserving data processing
                                    pipeline
                                  </li>
                                  <li>
                                    Create initial consent management interface
                                  </li>
                                  <li>
                                    Establish ethical guidelines for data
                                    partnerships
                                  </li>
                                </>
                              )}
                              {phaseIndex === 1 && (
                                <>
                                  <li>
                                    Implement initial compensation mechanisms
                                  </li>
                                  <li>
                                    Launch pilot programs with select research
                                    institutions
                                  </li>
                                  <li>
                                    Develop partner portal for data requests
                                  </li>
                                  <li>
                                    Create user dashboard for consent and
                                    compensation tracking
                                  </li>
                                </>
                              )}
                              {phaseIndex === 2 && (
                                <>
                                  <li>
                                    Implement blockchain-based consent and
                                    compensation
                                  </li>
                                  <li>
                                    Expand partner network to product developers
                                  </li>
                                  <li>
                                    Launch community challenges and collective
                                    value initiatives
                                  </li>
                                  <li>Develop advanced valuation algorithms</li>
                                </>
                              )}
                              {phaseIndex === 3 && (
                                <>
                                  <li>
                                    Establish JASON as industry standard for
                                    ethical data sharing
                                  </li>
                                  <li>
                                    Implement advanced collective bargaining
                                    mechanisms
                                  </li>
                                  <li>
                                    Develop cross-platform data dividend
                                    standards
                                  </li>
                                  <li>
                                    Create industry certification for ethical
                                    data partners
                                  </li>
                                </>
                              )}
                            </ul>
                          </accordion_1.AccordionContent>
                        </accordion_1.AccordionItem>
                        <accordion_1.AccordionItem value="deliverables">
                          <accordion_1.AccordionTrigger>
                            Key Deliverables
                          </accordion_1.AccordionTrigger>
                          <accordion_1.AccordionContent>
                            <ul className="list-disc pl-5 space-y-1">
                              {phaseIndex === 0 && (
                                <>
                                  <li>
                                    Data classification system with privacy
                                    impact ratings
                                  </li>
                                  <li>
                                    Local preprocessing framework with
                                    anonymization
                                  </li>
                                  <li>User-friendly consent management UI</li>
                                  <li>
                                    Partner requirements and vetting process
                                    documentation
                                  </li>
                                </>
                              )}
                              {phaseIndex === 1 && (
                                <>
                                  <li>
                                    Basic monetary and service-based
                                    compensation system
                                  </li>
                                  <li>
                                    Research partnership program with 3-5
                                    institutions
                                  </li>
                                  <li>
                                    Partner portal for data request submission
                                    and access
                                  </li>
                                  <li>
                                    User dashboard for consent management and
                                    earnings tracking
                                  </li>
                                </>
                              )}
                              {phaseIndex === 2 && (
                                <>
                                  <li>
                                    Blockchain-based consent ledger and smart
                                    contracts
                                  </li>
                                  <li>
                                    Expanded partner program for product
                                    manufacturers
                                  </li>
                                  <li>
                                    Community challenges with collective rewards
                                  </li>
                                  <li>
                                    Dynamic data valuation based on market
                                    demand
                                  </li>
                                </>
                              )}
                              {phaseIndex === 3 && (
                                <>
                                  <li>
                                    Industry consortium for ethical data
                                    standards
                                  </li>
                                  <li>
                                    Advanced collective bargaining platform
                                  </li>
                                  <li>
                                    Cross-platform data dividend protocols
                                  </li>
                                  <li>
                                    Partner certification program with
                                    independent verification
                                  </li>
                                </>
                              )}
                            </ul>
                          </accordion_1.AccordionContent>
                        </accordion_1.AccordionItem>
                      </accordion_1.Accordion>
                    </card_1.CardContent>
                  </card_1.Card>

                  {/* Developer Marketplace */}
                  <card_1.Card className="bg-gray-800/50 border-gray-700">
                    <card_1.CardHeader>
                      <div className="flex justify-between items-center">
                        <card_1.CardTitle>
                          Developer Marketplace
                        </card_1.CardTitle>
                        {getStatusBadge(
                          progressData.developerMarketplace[phase],
                        )}
                      </div>
                      <card_1.CardDescription>
                        Building a platform for third-party extensions and
                        innovations
                      </card_1.CardDescription>
                      <progress_1.Progress
                        value={progressData.developerMarketplace[phase]}
                        className="h-2 mt-2"
                      />
                    </card_1.CardHeader>
                    <card_1.CardContent>
                      <accordion_1.Accordion
                        type="single"
                        collapsible
                        className="w-full"
                      >
                        <accordion_1.AccordionItem value="objectives">
                          <accordion_1.AccordionTrigger>
                            Objectives
                          </accordion_1.AccordionTrigger>
                          <accordion_1.AccordionContent>
                            <ul className="list-disc pl-5 space-y-1">
                              {phaseIndex === 0 && (
                                <>
                                  <li>
                                    Design extension architecture and security
                                    model
                                  </li>
                                  <li>Develop core SDK and documentation</li>
                                  <li>
                                    Create developer portal with basic resources
                                  </li>
                                  <li>Implement extension packaging format</li>
                                </>
                              )}
                              {phaseIndex === 1 && (
                                <>
                                  <li>Launch developer beta program</li>
                                  <li>Implement basic monetization system</li>
                                  <li>Create showcase extensions</li>
                                  <li>
                                    Develop user installation and management
                                    experience
                                  </li>
                                </>
                              )}
                              {phaseIndex === 2 && (
                                <>
                                  <li>Launch public marketplace</li>
                                  <li>Implement full monetization options</li>
                                  <li>Develop ratings and review system</li>
                                  <li>Create featured extension program</li>
                                </>
                              )}
                              {phaseIndex === 3 && (
                                <>
                                  <li>
                                    Scale marketplace to 1,000+ extensions
                                  </li>
                                  <li>Implement advanced developer tools</li>
                                  <li>
                                    Launch developer certification program
                                  </li>
                                  <li>
                                    Create enterprise distribution channel
                                  </li>
                                </>
                              )}
                            </ul>
                          </accordion_1.AccordionContent>
                        </accordion_1.AccordionItem>
                        <accordion_1.AccordionItem value="deliverables">
                          <accordion_1.AccordionTrigger>
                            Key Deliverables
                          </accordion_1.AccordionTrigger>
                          <accordion_1.AccordionContent>
                            <ul className="list-disc pl-5 space-y-1">
                              {phaseIndex === 0 && (
                                <>
                                  <li>Extension architecture specification</li>
                                  <li>
                                    Initial SDK with core libraries and examples
                                  </li>
                                  <li>
                                    Developer portal with documentation and
                                    forums
                                  </li>
                                  <li>
                                    Extension packaging and installation system
                                  </li>
                                </>
                              )}
                              {phaseIndex === 1 && (
                                <>
                                  <li>
                                    Developer beta program with 100+
                                    participants
                                  </li>
                                  <li>
                                    Payment processing and revenue sharing
                                    system
                                  </li>
                                  <li>20+ high-quality showcase extensions</li>
                                  <li>
                                    User-friendly extension browser and manager
                                  </li>
                                </>
                              )}
                              {phaseIndex === 2 && (
                                <>
                                  <li>
                                    Public marketplace with 100+ extensions
                                  </li>
                                  <li>
                                    Complete monetization options (one-time,
                                    subscription, etc.)
                                  </li>
                                  <li>User rating and review system</li>
                                  <li>
                                    Featured extension program with marketing
                                    support
                                  </li>
                                </>
                              )}
                              {phaseIndex === 3 && (
                                <>
                                  <li>
                                    Marketplace with 1,000+ extensions across
                                    all categories
                                  </li>
                                  <li>
                                    Advanced developer tools and testing
                                    framework
                                  </li>
                                  <li>
                                    Developer certification program with
                                    multiple tiers
                                  </li>
                                  <li>
                                    Enterprise distribution channel for business
                                    customers
                                  </li>
                                </>
                              )}
                            </ul>
                          </accordion_1.AccordionContent>
                        </accordion_1.AccordionItem>
                      </accordion_1.Accordion>
                    </card_1.CardContent>
                  </card_1.Card>

                  {/* Hardware Hub */}
                  <card_1.Card className="bg-gray-800/50 border-gray-700">
                    <card_1.CardHeader>
                      <div className="flex justify-between items-center">
                        <card_1.CardTitle>Hardware Hub</card_1.CardTitle>
                        {getStatusBadge(progressData.hardwareHub[phase])}
                      </div>
                      <card_1.CardDescription>
                        Designing and manufacturing dedicated hardware for
                        optimal performance
                      </card_1.CardDescription>
                      <progress_1.Progress
                        value={progressData.hardwareHub[phase]}
                        className="h-2 mt-2"
                      />
                    </card_1.CardHeader>
                    <card_1.CardContent>
                      <accordion_1.Accordion
                        type="single"
                        collapsible
                        className="w-full"
                      >
                        <accordion_1.AccordionItem value="objectives">
                          <accordion_1.AccordionTrigger>
                            Objectives
                          </accordion_1.AccordionTrigger>
                          <accordion_1.AccordionContent>
                            <ul className="list-disc pl-5 space-y-1">
                              {phaseIndex === 0 && (
                                <>
                                  <li>Finalize hardware specifications</li>
                                  <li>Develop prototype units for testing</li>
                                  <li>Create manufacturing partnerships</li>
                                  <li>
                                    Design initial packaging and unboxing
                                    experience
                                  </li>
                                </>
                              )}
                              {phaseIndex === 1 && (
                                <>
                                  <li>
                                    Finalize industrial design and engineering
                                  </li>
                                  <li>Develop production firmware</li>
                                  <li>Conduct field testing with beta units</li>
                                  <li>
                                    Prepare manufacturing and supply chain
                                  </li>
                                </>
                              )}
                              {phaseIndex === 2 && (
                                <>
                                  <li>
                                    Launch Founder's Edition for early adopters
                                  </li>
                                  <li>Scale production to meet demand</li>
                                  <li>Establish retail partnerships</li>
                                  <li>
                                    Develop professional installer program
                                  </li>
                                </>
                              )}
                              {phaseIndex === 3 && (
                                <>
                                  <li>
                                    Expand product line with additional models
                                  </li>
                                  <li>Establish international distribution</li>
                                  <li>Develop OEM partnerships</li>
                                  <li>
                                    Create hardware ecosystem with companion
                                    devices
                                  </li>
                                </>
                              )}
                            </ul>
                          </accordion_1.AccordionContent>
                        </accordion_1.AccordionItem>
                        <accordion_1.AccordionItem value="deliverables">
                          <accordion_1.AccordionTrigger>
                            Key Deliverables
                          </accordion_1.AccordionTrigger>
                          <accordion_1.AccordionContent>
                            <ul className="list-disc pl-5 space-y-1">
                              {phaseIndex === 0 && (
                                <>
                                  <li>
                                    Detailed hardware specification document
                                  </li>
                                  <li>
                                    Working prototype units for internal testing
                                  </li>
                                  <li>Manufacturing partner agreements</li>
                                  <li>
                                    Packaging design and materials specification
                                  </li>
                                </>
                              )}
                              {phaseIndex === 1 && (
                                <>
                                  <li>
                                    Final industrial design and engineering
                                    specifications
                                  </li>
                                  <li>
                                    Production-ready firmware with OTA
                                    capability
                                  </li>
                                  <li>Beta testing program with 100+ units</li>
                                  <li>
                                    Manufacturing line setup and quality control
                                    processes
                                  </li>
                                </>
                              )}
                              {phaseIndex === 2 && (
                                <>
                                  <li>
                                    Limited Founder's Edition with special
                                    features
                                  </li>
                                  <li>Full production ramp-up</li>
                                  <li>Retail partnership agreements</li>
                                  <li>
                                    Professional installer certification program
                                  </li>
                                </>
                              )}
                              {phaseIndex === 3 && (
                                <>
                                  <li>
                                    Expanded product line (Mini, Pro, etc.)
                                  </li>
                                  <li>
                                    International distribution in 20+ countries
                                  </li>
                                  <li>
                                    OEM partnership program for integration
                                  </li>
                                  <li>
                                    First companion devices (satellites,
                                    sensors, etc.)
                                  </li>
                                </>
                              )}
                            </ul>
                          </accordion_1.AccordionContent>
                        </accordion_1.AccordionItem>
                      </accordion_1.Accordion>
                    </card_1.CardContent>
                  </card_1.Card>
                </div>
              </tabs_1.TabsContent>
            );
          },
        )}
      </tabs_1.Tabs>
    </div>
  );
};
exports.default = Roadmap;
