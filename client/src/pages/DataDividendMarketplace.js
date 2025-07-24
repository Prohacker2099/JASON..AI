"use strict";
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var DataDividendMarketplace = function () {
  var _a = (0, react_1.useState)([]),
    opportunities = _a[0],
    setOpportunities = _a[1];
  var _b = (0, react_1.useState)(null),
    userEarnings = _b[0],
    setUserEarnings = _b[1];
  var _c = (0, react_1.useState)({}),
    consentSettings = _c[0],
    setConsentSettings = _c[1];
  var _d = (0, react_1.useState)(null),
    selectedOpportunity = _d[0],
    setSelectedOpportunity = _d[1];
  var _e = (0, react_1.useState)("marketplace"),
    activeTab = _e[0],
    setActiveTab = _e[1];
  var _f = (0, react_1.useState)("all"),
    filter = _f[0],
    setFilter = _f[1];
  (0, react_1.useEffect)(function () {
    // Initialize mock data
    var mockOpportunities = [
      {
        id: "green-energy-research",
        partnerId: "greentech-labs",
        partnerName: "GreenTech Research Labs",
        partnerType: "research",
        title: "Smart Home Energy Optimization Study",
        description:
          "Help us understand energy consumption patterns to develop better renewable energy solutions for smart homes.",
        dataCategories: [
          "energy_usage",
          "device_patterns",
          "environmental_data",
        ],
        purposes: ["research", "environmental_impact", "energy_optimization"],
        compensation: {
          type: "monetary",
          amount: 5.2,
          currency: "USD",
          frequency: "daily",
          description: "Earn $5.20 daily for sharing anonymized energy data",
        },
        privacyLevel: "enhanced",
        duration: 90,
        participantCount: 2847,
        maxParticipants: 5000,
        rating: 4.8,
        transparencyScore: 95,
        benefits: [
          "Contribute to renewable energy research",
          "Help reduce global carbon footprint",
          "Receive personalized energy insights",
          "Early access to green tech products",
        ],
        requirements: [
          "Smart home with energy monitoring",
          "At least 30 days of usage data",
          "Consent to anonymized data sharing",
        ],
        status: "active",
        featured: true,
        impact: {
          type: "environmental",
          description:
            "Your data helps develop solutions that could reduce global energy consumption by 15%",
          metrics: "2.3M tons CO2 saved annually",
        },
      },
      {
        id: "health-wellness-ai",
        partnerId: "wellness-ai",
        partnerName: "Wellness AI Foundation",
        partnerType: "nonprofit",
        title: "Home Environment & Wellness Correlation",
        description:
          "Research how smart home environments affect occupant health and wellness outcomes.",
        dataCategories: [
          "environmental_sensors",
          "usage_patterns",
          "wellness_metrics",
        ],
        purposes: ["health_research", "wellness_optimization", "public_health"],
        compensation: {
          type: "donation",
          amount: 3.5,
          currency: "USD",
          frequency: "daily",
          description: "$3.50 daily donated to health charities in your name",
        },
        privacyLevel: "maximum",
        duration: 180,
        participantCount: 1523,
        maxParticipants: 3000,
        rating: 4.9,
        transparencyScore: 98,
        benefits: [
          "Support global health research",
          "Receive wellness insights",
          "Tax-deductible charitable contribution",
          "Impact report on research outcomes",
        ],
        requirements: [
          "Environmental sensors in home",
          "Wellness tracking devices (optional)",
          "Minimum 60 days participation",
        ],
        status: "active",
        featured: true,
        impact: {
          type: "health",
          description:
            "Research could improve health outcomes for millions of people",
          metrics: "Potential to prevent 50K health issues annually",
        },
      },
      {
        id: "smart-city-planning",
        partnerId: "urban-dynamics",
        partnerName: "Urban Dynamics Corp",
        partnerType: "commercial",
        title: "Smart City Infrastructure Planning",
        description:
          "Help design better smart city infrastructure by sharing aggregated home automation patterns.",
        dataCategories: ["device_usage", "automation_patterns", "network_data"],
        purposes: [
          "urban_planning",
          "infrastructure_design",
          "smart_city_development",
        ],
        compensation: {
          type: "monetary",
          amount: 8.75,
          currency: "USD",
          frequency: "weekly",
          description: "Weekly payments of $8.75 for infrastructure data",
        },
        privacyLevel: "basic",
        duration: 365,
        participantCount: 892,
        maxParticipants: 2000,
        rating: 4.6,
        transparencyScore: 87,
        benefits: [
          "Shape future smart city development",
          "Higher compensation rates",
          "Quarterly progress reports",
          "Beta access to smart city services",
        ],
        requirements: [
          "Smart home automation system",
          "Stable internet connection",
          "Located in participating metro areas",
        ],
        status: "active",
        featured: false,
        impact: {
          type: "social",
          description:
            "Data helps build more efficient and livable smart cities",
          metrics: "15% improvement in city service efficiency",
        },
      },
      {
        id: "ai-behavior-research",
        partnerId: "cognitive-labs",
        partnerName: "Cognitive Research Institute",
        partnerType: "research",
        title: "Human-AI Interaction Patterns",
        description:
          "Study how people interact with AI assistants to improve natural language understanding.",
        dataCategories: [
          "voice_interactions",
          "command_patterns",
          "response_feedback",
        ],
        purposes: ["ai_research", "nlp_improvement", "user_experience"],
        compensation: {
          type: "service",
          amount: 15.0,
          currency: "USD",
          frequency: "monthly",
          description: "$15 monthly credit for premium AI services",
        },
        privacyLevel: "enhanced",
        duration: 120,
        participantCount: 456,
        maxParticipants: 1000,
        rating: 4.7,
        transparencyScore: 92,
        benefits: [
          "Advance AI research",
          "Premium service credits",
          "Early access to new AI features",
          "Research publication acknowledgment",
        ],
        requirements: [
          "Active voice assistant usage",
          "Minimum 50 interactions per month",
          "English language primary",
        ],
        status: "active",
        featured: false,
        impact: {
          type: "research",
          description: "Helps create more intuitive and helpful AI assistants",
          metrics: "40% improvement in AI understanding accuracy",
        },
      },
    ];
    setOpportunities(mockOpportunities);
    // Mock user earnings
    setUserEarnings({
      totalEarnings: 247.83,
      pendingEarnings: 23.45,
      thisMonth: 89.2,
      lastMonth: 76.15,
      transactionCount: 45,
      activeOpportunities: 3,
      paymentMethods: {
        default: "paypal-1",
        methods: [
          {
            id: "paypal-1",
            type: "paypal",
            name: "PayPal",
            details: "user@email.com",
          },
          {
            id: "bank-1",
            type: "bank",
            name: "Bank Account",
            details: "****1234",
          },
          {
            id: "crypto-1",
            type: "crypto",
            name: "Bitcoin Wallet",
            details: "1A1z...Nx7",
          },
        ],
      },
    });
    // Mock consent settings
    setConsentSettings({
      energy_usage: {
        enabled: true,
        level: "enhanced",
        autoConsent: false,
        maxDuration: 90,
      },
      device_patterns: {
        enabled: true,
        level: "basic",
        autoConsent: true,
        maxDuration: 30,
      },
      environmental_data: {
        enabled: true,
        level: "maximum",
        autoConsent: false,
        maxDuration: 180,
      },
      voice_interactions: {
        enabled: false,
        level: "enhanced",
        autoConsent: false,
        maxDuration: 60,
      },
      usage_patterns: {
        enabled: true,
        level: "basic",
        autoConsent: true,
        maxDuration: 365,
      },
    });
  }, []);
  var filteredOpportunities = opportunities.filter(function (opp) {
    var _a;
    switch (filter) {
      case "featured":
        return opp.featured;
      case "high-paying":
        return opp.compensation.amount >= 5;
      case "research":
        return (
          opp.partnerType === "research" || opp.partnerType === "nonprofit"
        );
      case "environmental":
        return (
          ((_a = opp.impact) === null || _a === void 0 ? void 0 : _a.type) ===
          "environmental"
        );
      default:
        return true;
    }
  });
  var getPartnerTypeIcon = function (type) {
    switch (type) {
      case "research":
        return <lucide_react_1.Brain className="w-4 h-4" />;
      case "nonprofit":
        return <lucide_react_1.Heart className="w-4 h-4" />;
      case "commercial":
        return <lucide_react_1.DollarSign className="w-4 h-4" />;
      case "government":
        return <lucide_react_1.Shield className="w-4 h-4" />;
      default:
        return <lucide_react_1.Globe className="w-4 h-4" />;
    }
  };
  var getImpactIcon = function (type) {
    switch (type) {
      case "environmental":
        return <lucide_react_1.Leaf className="w-4 h-4 text-green-400" />;
      case "health":
        return <lucide_react_1.Heart className="w-4 h-4 text-red-400" />;
      case "research":
        return <lucide_react_1.Brain className="w-4 h-4 text-purple-400" />;
      case "social":
        return <lucide_react_1.Users className="w-4 h-4 text-blue-400" />;
      default:
        return <lucide_react_1.Globe className="w-4 h-4 text-gray-400" />;
    }
  };
  var getCompensationIcon = function (type) {
    switch (type) {
      case "monetary":
        return <lucide_react_1.DollarSign className="w-4 h-4" />;
      case "service":
        return <lucide_react_1.Zap className="w-4 h-4" />;
      case "credit":
        return <lucide_react_1.CreditCard className="w-4 h-4" />;
      case "donation":
        return <lucide_react_1.Gift className="w-4 h-4" />;
      default:
        return <lucide_react_1.Wallet className="w-4 h-4" />;
    }
  };
  var handleJoinOpportunity = function (opportunity) {
    // Here you would implement the actual joining logic
    console.log("Joining opportunity:", opportunity.id);
    setSelectedOpportunity(null);
  };
  var renderMarketplace = function () {
    return (
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3">
          {[
            { key: "all", label: "All Opportunities" },
            { key: "featured", label: "Featured" },
            { key: "high-paying", label: "High Paying" },
            { key: "research", label: "Research" },
            { key: "environmental", label: "Environmental" },
          ].map(function (_a) {
            var key = _a.key,
              label = _a.label;
            return (
              <button
                key={key}
                onClick={function () {
                  return setFilter(key);
                }}
                className={"px-4 py-2 rounded-lg font-medium transition-all duration-300 ".concat(
                  filter === key
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white/10 text-white/80 hover:bg-white/20",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Opportunities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOpportunities.map(function (opportunity) {
            return (
              <framer_motion_1.motion.div
                key={opportunity.id}
                className={"p-6 rounded-2xl backdrop-blur-sm border cursor-pointer transition-all duration-300 ".concat(
                  opportunity.featured
                    ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/30"
                    : "bg-white/10 border-white/20",
                )}
                whileHover={{ scale: 1.02, y: -5 }}
                onClick={function () {
                  return setSelectedOpportunity(opportunity);
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {opportunity.featured && (
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold rounded-full">
                      ⭐ FEATURED
                    </span>
                    <div className="flex items-center space-x-2">
                      <lucide_react_1.Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm">{opportunity.rating}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={"p-2 rounded-lg ".concat(
                        opportunity.partnerType === "research"
                          ? "bg-purple-500/30"
                          : opportunity.partnerType === "nonprofit"
                            ? "bg-red-500/30"
                            : opportunity.partnerType === "commercial"
                              ? "bg-green-500/30"
                              : "bg-blue-500/30",
                      )}
                    >
                      {getPartnerTypeIcon(opportunity.partnerType)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {opportunity.title}
                      </h3>
                      <p className="text-white/70 text-sm">
                        {opportunity.partnerName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-green-400 font-bold">
                      {getCompensationIcon(opportunity.compensation.type)}
                      <span>${opportunity.compensation.amount}</span>
                    </div>
                    <div className="text-xs text-white/60">
                      {opportunity.compensation.frequency}
                    </div>
                  </div>
                </div>

                <p className="text-white/80 text-sm mb-4 line-clamp-2">
                  {opportunity.description}
                </p>

                {opportunity.impact && (
                  <div className="flex items-center space-x-2 mb-4 p-3 rounded-lg bg-white/5">
                    {getImpactIcon(opportunity.impact.type)}
                    <span className="text-sm text-white/80">
                      {opportunity.impact.description}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-white/60">
                    <span className="flex items-center space-x-1">
                      <lucide_react_1.Users className="w-3 h-3" />
                      <span>
                        {opportunity.participantCount.toLocaleString()}
                      </span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <lucide_react_1.Clock className="w-3 h-3" />
                      <span>{opportunity.duration} days</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <lucide_react_1.Shield className="w-3 h-3" />
                      <span>{opportunity.privacyLevel}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div
                      className={"w-2 h-2 rounded-full ".concat(
                        opportunity.status === "active"
                          ? "bg-green-400"
                          : opportunity.status === "pending"
                            ? "bg-yellow-400"
                            : "bg-red-400",
                      )}
                    />
                    <span className="text-xs capitalize">
                      {opportunity.status}
                    </span>
                  </div>
                </div>
              </framer_motion_1.motion.div>
            );
          })}
        </div>
      </div>
    );
  };
  var renderEarnings = function () {
    return (
      <div className="space-y-6">
        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30">
            <div className="flex items-center justify-between mb-2">
              <lucide_react_1.Wallet className="w-8 h-8 text-green-400" />
              <lucide_react_1.TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-300">
              $
              {userEarnings === null || userEarnings === void 0
                ? void 0
                : userEarnings.totalEarnings.toFixed(2)}
            </div>
            <div className="text-sm text-green-400">Total Earned</div>
          </div>

          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <lucide_react_1.Clock className="w-8 h-8 text-yellow-400" />
              <span className="text-xs bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded-full">
                Pending
              </span>
            </div>
            <div className="text-3xl font-bold">
              $
              {userEarnings === null || userEarnings === void 0
                ? void 0
                : userEarnings.pendingEarnings.toFixed(2)}
            </div>
            <div className="text-sm text-white/60">Pending Payment</div>
          </div>

          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <lucide_react_1.Calendar className="w-8 h-8 text-blue-400" />
              <span className="text-xs text-blue-300">This Month</span>
            </div>
            <div className="text-3xl font-bold">
              $
              {userEarnings === null || userEarnings === void 0
                ? void 0
                : userEarnings.thisMonth.toFixed(2)}
            </div>
            <div className="text-sm text-white/60">Monthly Earnings</div>
          </div>

          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <lucide_react_1.BarChart3 className="w-8 h-8 text-purple-400" />
              <span className="text-xs text-purple-300">
                {userEarnings === null || userEarnings === void 0
                  ? void 0
                  : userEarnings.activeOpportunities}{" "}
                Active
              </span>
            </div>
            <div className="text-3xl font-bold">
              {userEarnings === null || userEarnings === void 0
                ? void 0
                : userEarnings.transactionCount}
            </div>
            <div className="text-sm text-white/60">Total Transactions</div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <lucide_react_1.CreditCard className="w-6 h-6 mr-2" />
            Payment Methods
          </h3>
          <div className="space-y-3">
            {userEarnings === null || userEarnings === void 0
              ? void 0
              : userEarnings.paymentMethods.methods.map(function (method) {
                  return (
                    <div
                      key={method.id}
                      className={"flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ".concat(
                        method.id === userEarnings.paymentMethods.default
                          ? "bg-blue-500/20 border-blue-400/30"
                          : "bg-white/5 border-white/10",
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-white/20">
                          {method.type === "paypal" && (
                            <lucide_react_1.Wallet className="w-5 h-5" />
                          )}
                          {method.type === "bank" && (
                            <lucide_react_1.Banknote className="w-5 h-5" />
                          )}
                          {method.type === "crypto" && (
                            <lucide_react_1.DollarSign className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-white/60">
                            {method.details}
                          </div>
                        </div>
                      </div>
                      {method.id === userEarnings.paymentMethods.default && (
                        <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  );
                })}
          </div>
          <button className="w-full mt-4 p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300">
            Add Payment Method
          </button>
        </div>
      </div>
    );
  };
  var renderSettings = function () {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <lucide_react_1.Shield className="w-6 h-6 mr-2" />
            Data Consent Settings
          </h3>
          <div className="space-y-4">
            {Object.entries(consentSettings).map(function (_a) {
              var category = _a[0],
                settings = _a[1];
              return (
                <div
                  key={category}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium capitalize">
                        {category.replace("_", " ")}
                      </h4>
                      <p className="text-sm text-white/60">
                        Control how this data category is shared
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={function () {
                          return setConsentSettings(function (prev) {
                            var _a;
                            return __assign(
                              __assign({}, prev),
                              ((_a = {}),
                              (_a[category] = __assign(
                                __assign({}, prev[category]),
                                { enabled: !prev[category].enabled },
                              )),
                              _a),
                            );
                          });
                        }}
                        className={"w-12 h-6 rounded-full transition-all duration-300 ".concat(
                          settings.enabled ? "bg-green-500" : "bg-gray-600",
                        )}
                      >
                        <div
                          className={"w-5 h-5 bg-white rounded-full transition-transform duration-300 ".concat(
                            settings.enabled
                              ? "translate-x-6"
                              : "translate-x-0.5",
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {settings.enabled && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Privacy Level
                        </label>
                        <select
                          value={settings.level}
                          onChange={function (e) {
                            return setConsentSettings(function (prev) {
                              var _a;
                              return __assign(
                                __assign({}, prev),
                                ((_a = {}),
                                (_a[category] = __assign(
                                  __assign({}, prev[category]),
                                  { level: e.target.value },
                                )),
                                _a),
                              );
                            });
                          }}
                          className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
                        >
                          <option value="basic">
                            Basic - Aggregated data only
                          </option>
                          <option value="enhanced">
                            Enhanced - Anonymized individual data
                          </option>
                          <option value="maximum">
                            Maximum - Full anonymization + encryption
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Maximum Duration (days)
                        </label>
                        <input
                          type="number"
                          value={settings.maxDuration}
                          onChange={function (e) {
                            return setConsentSettings(function (prev) {
                              var _a;
                              return __assign(
                                __assign({}, prev),
                                ((_a = {}),
                                (_a[category] = __assign(
                                  __assign({}, prev[category]),
                                  { maxDuration: parseInt(e.target.value) },
                                )),
                                _a),
                              );
                            });
                          }}
                          className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
                          min="1"
                          max="365"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.autoConsent}
                          onChange={function (e) {
                            return setConsentSettings(function (prev) {
                              var _a;
                              return __assign(
                                __assign({}, prev),
                                ((_a = {}),
                                (_a[category] = __assign(
                                  __assign({}, prev[category]),
                                  { autoConsent: e.target.checked },
                                )),
                                _a),
                              );
                            });
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <label className="text-sm">
                          Auto-consent to similar opportunities
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center">
            <lucide_react_1.DollarSign className="w-10 h-10 mr-3 text-green-400" />
            Data Dividend Marketplace
          </h1>
          <p className="text-white/70 text-lg">
            Own your data. Share ethically. Earn fairly. Shape the future.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-white/10 rounded-lg p-1">
          {[
            {
              key: "marketplace",
              label: "Marketplace",
              icon: <lucide_react_1.Globe className="w-5 h-5" />,
            },
            {
              key: "earnings",
              label: "My Earnings",
              icon: <lucide_react_1.TrendingUp className="w-5 h-5" />,
            },
            {
              key: "settings",
              label: "Privacy Settings",
              icon: <lucide_react_1.Shield className="w-5 h-5" />,
            },
          ].map(function (_a) {
            var key = _a.key,
              label = _a.label,
              icon = _a.icon;
            return (
              <button
                key={key}
                onClick={function () {
                  return setActiveTab(key);
                }}
                className={"flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ".concat(
                  activeTab === key
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "text-white/70 hover:text-white hover:bg-white/10",
                )}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <framer_motion_1.AnimatePresence mode="wait">
          <framer_motion_1.motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "marketplace" && renderMarketplace()}
            {activeTab === "earnings" && renderEarnings()}
            {activeTab === "settings" && renderSettings()}
          </framer_motion_1.motion.div>
        </framer_motion_1.AnimatePresence>

        {/* Opportunity Detail Modal */}
        <framer_motion_1.AnimatePresence>
          {selectedOpportunity && (
            <framer_motion_1.motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={function () {
                return setSelectedOpportunity(null);
              }}
            >
              <framer_motion_1.motion.div
                className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={function (e) {
                  return e.stopPropagation();
                }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {selectedOpportunity.title}
                    </h2>
                    <p className="text-white/70">
                      {selectedOpportunity.partnerName}
                    </p>
                  </div>
                  <button
                    onClick={function () {
                      return setSelectedOpportunity(null);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <lucide_react_1.XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-white/80">
                      {selectedOpportunity.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Compensation</h3>
                      <div className="p-4 rounded-lg bg-green-500/20 border border-green-400/30">
                        <div className="flex items-center space-x-2 text-green-400 font-bold text-xl">
                          {getCompensationIcon(
                            selectedOpportunity.compensation.type,
                          )}
                          <span>
                            ${selectedOpportunity.compensation.amount}
                          </span>
                        </div>
                        <p className="text-sm text-green-300">
                          {selectedOpportunity.compensation.description}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Privacy & Security</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Privacy Level:</span>
                          <span className="font-medium capitalize">
                            {selectedOpportunity.privacyLevel}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Transparency Score:</span>
                          <span className="font-medium">
                            {selectedOpportunity.transparencyScore}/100
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Duration:</span>
                          <span className="font-medium">
                            {selectedOpportunity.duration} days
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Benefits</h3>
                    <ul className="space-y-1">
                      {selectedOpportunity.benefits.map(
                        function (benefit, index) {
                          return (
                            <li
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <lucide_react_1.CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-white/80">{benefit}</span>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Requirements</h3>
                    <ul className="space-y-1">
                      {selectedOpportunity.requirements.map(
                        function (requirement, index) {
                          return (
                            <li
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <lucide_react_1.Info className="w-4 h-4 text-blue-400" />
                              <span className="text-white/80">
                                {requirement}
                              </span>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  </div>

                  {selectedOpportunity.impact && (
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <h3 className="font-semibold mb-2 flex items-center">
                        {getImpactIcon(selectedOpportunity.impact.type)}
                        <span className="ml-2">Impact</span>
                      </h3>
                      <p className="text-white/80 mb-2">
                        {selectedOpportunity.impact.description}
                      </p>
                      {selectedOpportunity.impact.metrics && (
                        <p className="text-sm text-white/60">
                          Expected Impact: {selectedOpportunity.impact.metrics}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      onClick={function () {
                        return handleJoinOpportunity(selectedOpportunity);
                      }}
                      className="flex-1 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
                    >
                      Join Opportunity
                    </button>
                    <button
                      onClick={function () {
                        return setSelectedOpportunity(null);
                      }}
                      className="px-6 py-4 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </framer_motion_1.motion.div>
            </framer_motion_1.motion.div>
          )}
        </framer_motion_1.AnimatePresence>
      </div>
    </div>
  );
};
exports.default = DataDividendMarketplace;
var DataDividendMarketplace = function () {
  var _a = (0, react_1.useState)([]),
    opportunities = _a[0],
    setOpportunities = _a[1];
  var _b = (0, react_1.useState)(null),
    userEarnings = _b[0],
    setUserEarnings = _b[1];
  var _c = (0, react_1.useState)({}),
    consentSettings = _c[0],
    setConsentSettings = _c[1];
  var _d = (0, react_1.useState)(null),
    selectedOpportunity = _d[0],
    setSelectedOpportunity = _d[1];
  var _e = (0, react_1.useState)("marketplace"),
    activeTab = _e[0],
    setActiveTab = _e[1];
  var _f = (0, react_1.useState)("all"),
    filter = _f[0],
    setFilter = _f[1];
  (0, react_1.useEffect)(function () {
    // Initialize mock data
    var mockOpportunities = [
      {
        id: "green-energy-research",
        partnerId: "greentech-labs",
        partnerName: "GreenTech Research Labs",
        partnerType: "research",
        title: "Smart Home Energy Optimization Study",
        description:
          "Help us understand energy consumption patterns to develop better renewable energy solutions for smart homes.",
        dataCategories: [
          "energy_usage",
          "device_patterns",
          "environmental_data",
        ],
        purposes: ["research", "environmental_impact", "energy_optimization"],
        compensation: {
          type: "monetary",
          amount: 5.2,
          currency: "USD",
          frequency: "daily",
          description: "Earn $5.20 daily for sharing anonymized energy data",
        },
        privacyLevel: "enhanced",
        duration: 90,
        participantCount: 2847,
        maxParticipants: 5000,
        rating: 4.8,
        transparencyScore: 95,
        benefits: [
          "Contribute to renewable energy research",
          "Help reduce global carbon footprint",
          "Receive personalized energy insights",
          "Early access to green tech products",
        ],
        requirements: [
          "Smart home with energy monitoring",
          "At least 30 days of usage data",
          "Consent to anonymized data sharing",
        ],
        status: "active",
        featured: true,
        impact: {
          type: "environmental",
          description:
            "Your data helps develop solutions that could reduce global energy consumption by 15%",
          metrics: "2.3M tons CO2 saved annually",
        },
      },
      {
        id: "health-wellness-ai",
        partnerId: "wellness-ai",
        partnerName: "Wellness AI Foundation",
        partnerType: "nonprofit",
        title: "Home Environment & Wellness Correlation",
        description:
          "Research how smart home environments affect occupant health and wellness outcomes.",
        dataCategories: [
          "environmental_sensors",
          "usage_patterns",
          "wellness_metrics",
        ],
        purposes: ["health_research", "wellness_optimization", "public_health"],
        compensation: {
          type: "donation",
          amount: 3.5,
          currency: "USD",
          frequency: "daily",
          description: "$3.50 daily donated to health charities in your name",
        },
        privacyLevel: "maximum",
        duration: 180,
        participantCount: 1523,
        maxParticipants: 3000,
        rating: 4.9,
        transparencyScore: 98,
        benefits: [
          "Support global health research",
          "Receive wellness insights",
          "Tax-deductible charitable contribution",
          "Impact report on research outcomes",
        ],
        requirements: [
          "Environmental sensors in home",
          "Wellness tracking devices (optional)",
          "Minimum 60 days participation",
        ],
        status: "active",
        featured: true,
        impact: {
          type: "health",
          description:
            "Research could improve health outcomes for millions of people",
          metrics: "Potential to prevent 50K health issues annually",
        },
      },
      {
        id: "smart-city-planning",
        partnerId: "urban-dynamics",
        partnerName: "Urban Dynamics Corp",
        partnerType: "commercial",
        title: "Smart City Infrastructure Planning",
        description:
          "Help design better smart city infrastructure by sharing aggregated home automation patterns.",
        dataCategories: ["device_usage", "automation_patterns", "network_data"],
        purposes: [
          "urban_planning",
          "infrastructure_design",
          "smart_city_development",
        ],
        compensation: {
          type: "monetary",
          amount: 8.75,
          currency: "USD",
          frequency: "weekly",
          description: "Weekly payments of $8.75 for infrastructure data",
        },
        privacyLevel: "basic",
        duration: 365,
        participantCount: 892,
        maxParticipants: 2000,
        rating: 4.6,
        transparencyScore: 87,
        benefits: [
          "Shape future smart city development",
          "Higher compensation rates",
          "Quarterly progress reports",
          "Beta access to smart city services",
        ],
        requirements: [
          "Smart home automation system",
          "Stable internet connection",
          "Located in participating metro areas",
        ],
        status: "active",
        featured: false,
        impact: {
          type: "social",
          description:
            "Data helps build more efficient and livable smart cities",
          metrics: "15% improvement in city service efficiency",
        },
      },
      {
        id: "ai-behavior-research",
        partnerId: "cognitive-labs",
        partnerName: "Cognitive Research Institute",
        partnerType: "research",
        title: "Human-AI Interaction Patterns",
        description:
          "Study how people interact with AI assistants to improve natural language understanding.",
        dataCategories: [
          "voice_interactions",
          "command_patterns",
          "response_feedback",
        ],
        purposes: ["ai_research", "nlp_improvement", "user_experience"],
        compensation: {
          type: "service",
          amount: 15.0,
          currency: "USD",
          frequency: "monthly",
          description: "$15 monthly credit for premium AI services",
        },
        privacyLevel: "enhanced",
        duration: 120,
        participantCount: 456,
        maxParticipants: 1000,
        rating: 4.7,
        transparencyScore: 92,
        benefits: [
          "Advance AI research",
          "Premium service credits",
          "Early access to new AI features",
          "Research publication acknowledgment",
        ],
        requirements: [
          "Active voice assistant usage",
          "Minimum 50 interactions per month",
          "English language primary",
        ],
        status: "active",
        featured: false,
        impact: {
          type: "research",
          description: "Helps create more intuitive and helpful AI assistants",
          metrics: "40% improvement in AI understanding accuracy",
        },
      },
    ];
    setOpportunities(mockOpportunities);
    // Mock user earnings
    setUserEarnings({
      totalEarnings: 247.83,
      pendingEarnings: 23.45,
      thisMonth: 89.2,
      lastMonth: 76.15,
      transactionCount: 45,
      activeOpportunities: 3,
      paymentMethods: {
        default: "paypal-1",
        methods: [
          {
            id: "paypal-1",
            type: "paypal",
            name: "PayPal",
            details: "user@email.com",
          },
          {
            id: "bank-1",
            type: "bank",
            name: "Bank Account",
            details: "****1234",
          },
          {
            id: "crypto-1",
            type: "crypto",
            name: "Bitcoin Wallet",
            details: "1A1z...Nx7",
          },
        ],
      },
    });
    // Mock consent settings
    setConsentSettings({
      energy_usage: {
        enabled: true,
        level: "enhanced",
        autoConsent: false,
        maxDuration: 90,
      },
      device_patterns: {
        enabled: true,
        level: "basic",
        autoConsent: true,
        maxDuration: 30,
      },
      environmental_data: {
        enabled: true,
        level: "maximum",
        autoConsent: false,
        maxDuration: 180,
      },
      voice_interactions: {
        enabled: false,
        level: "enhanced",
        autoConsent: false,
        maxDuration: 60,
      },
      usage_patterns: {
        enabled: true,
        level: "basic",
        autoConsent: true,
        maxDuration: 365,
      },
    });
  }, []);
  var filteredOpportunities = opportunities.filter(function (opp) {
    var _a;
    switch (filter) {
      case "featured":
        return opp.featured;
      case "high-paying":
        return opp.compensation.amount >= 5;
      case "research":
        return (
          opp.partnerType === "research" || opp.partnerType === "nonprofit"
        );
      case "environmental":
        return (
          ((_a = opp.impact) === null || _a === void 0 ? void 0 : _a.type) ===
          "environmental"
        );
      default:
        return true;
    }
  });
  var getPartnerTypeIcon = function (type) {
    switch (type) {
      case "research":
        return <lucide_react_1.Brain className="w-4 h-4" />;
      case "nonprofit":
        return <lucide_react_1.Heart className="w-4 h-4" />;
      case "commercial":
        return <lucide_react_1.DollarSign className="w-4 h-4" />;
      case "government":
        return <lucide_react_1.Shield className="w-4 h-4" />;
      default:
        return <lucide_react_1.Globe className="w-4 h-4" />;
    }
  };
  var getImpactIcon = function (type) {
    switch (type) {
      case "environmental":
        return <lucide_react_1.Leaf className="w-4 h-4 text-green-400" />;
      case "health":
        return <lucide_react_1.Heart className="w-4 h-4 text-red-400" />;
      case "research":
        return <lucide_react_1.Brain className="w-4 h-4 text-purple-400" />;
      case "social":
        return <lucide_react_1.Users className="w-4 h-4 text-blue-400" />;
      default:
        return <lucide_react_1.Globe className="w-4 h-4 text-gray-400" />;
    }
  };
  var getCompensationIcon = function (type) {
    switch (type) {
      case "monetary":
        return <lucide_react_1.DollarSign className="w-4 h-4" />;
      case "service":
        return <lucide_react_1.Zap className="w-4 h-4" />;
      case "credit":
        return <lucide_react_1.CreditCard className="w-4 h-4" />;
      case "donation":
        return <lucide_react_1.Gift className="w-4 h-4" />;
      default:
        return <lucide_react_1.Wallet className="w-4 h-4" />;
    }
  };
  var handleJoinOpportunity = function (opportunity) {
    // Here you would implement the actual joining logic
    console.log("Joining opportunity:", opportunity.id);
    setSelectedOpportunity(null);
  };
  var renderMarketplace = function () {
    return (
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3">
          {[
            { key: "all", label: "All Opportunities" },
            { key: "featured", label: "Featured" },
            { key: "high-paying", label: "High Paying" },
            { key: "research", label: "Research" },
            { key: "environmental", label: "Environmental" },
          ].map(function (_a) {
            var key = _a.key,
              label = _a.label;
            return (
              <button
                key={key}
                onClick={function () {
                  return setFilter(key);
                }}
                className={"px-4 py-2 rounded-lg font-medium transition-all duration-300 ".concat(
                  filter === key
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white/10 text-white/80 hover:bg-white/20",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Opportunities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOpportunities.map(function (opportunity) {
            return (
              <framer_motion_1.motion.div
                key={opportunity.id}
                className={"p-6 rounded-2xl backdrop-blur-sm border cursor-pointer transition-all duration-300 ".concat(
                  opportunity.featured
                    ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/30"
                    : "bg-white/10 border-white/20",
                )}
                whileHover={{ scale: 1.02, y: -5 }}
                onClick={function () {
                  return setSelectedOpportunity(opportunity);
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {opportunity.featured && (
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold rounded-full">
                      ⭐ FEATURED
                    </span>
                    <div className="flex items-center space-x-2">
                      <lucide_react_1.Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm">{opportunity.rating}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={"p-2 rounded-lg ".concat(
                        opportunity.partnerType === "research"
                          ? "bg-purple-500/30"
                          : opportunity.partnerType === "nonprofit"
                            ? "bg-red-500/30"
                            : opportunity.partnerType === "commercial"
                              ? "bg-green-500/30"
                              : "bg-blue-500/30",
                      )}
                    >
                      {getPartnerTypeIcon(opportunity.partnerType)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {opportunity.title}
                      </h3>
                      <p className="text-white/70 text-sm">
                        {opportunity.partnerName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-green-400 font-bold">
                      {getCompensationIcon(opportunity.compensation.type)}
                      <span>${opportunity.compensation.amount}</span>
                    </div>
                    <div className="text-xs text-white/60">
                      {opportunity.compensation.frequency}
                    </div>
                  </div>
                </div>

                <p className="text-white/80 text-sm mb-4 line-clamp-2">
                  {opportunity.description}
                </p>

                {opportunity.impact && (
                  <div className="flex items-center space-x-2 mb-4 p-3 rounded-lg bg-white/5">
                    {getImpactIcon(opportunity.impact.type)}
                    <span className="text-sm text-white/80">
                      {opportunity.impact.description}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-white/60">
                    <span className="flex items-center space-x-1">
                      <lucide_react_1.Users className="w-3 h-3" />
                      <span>
                        {opportunity.participantCount.toLocaleString()}
                      </span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <lucide_react_1.Clock className="w-3 h-3" />
                      <span>{opportunity.duration} days</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <lucide_react_1.Shield className="w-3 h-3" />
                      <span>{opportunity.privacyLevel}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div
                      className={"w-2 h-2 rounded-full ".concat(
                        opportunity.status === "active"
                          ? "bg-green-400"
                          : opportunity.status === "pending"
                            ? "bg-yellow-400"
                            : "bg-red-400",
                      )}
                    />
                    <span className="text-xs capitalize">
                      {opportunity.status}
                    </span>
                  </div>
                </div>
              </framer_motion_1.motion.div>
            );
          })}
        </div>
      </div>
    );
  };
  var renderEarnings = function () {
    return (
      <div className="space-y-6">
        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30">
            <div className="flex items-center justify-between mb-2">
              <lucide_react_1.Wallet className="w-8 h-8 text-green-400" />
              <lucide_react_1.TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-300">
              $
              {userEarnings === null || userEarnings === void 0
                ? void 0
                : userEarnings.totalEarnings.toFixed(2)}
            </div>
            <div className="text-sm text-green-400">Total Earned</div>
          </div>

          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <lucide_react_1.Clock className="w-8 h-8 text-yellow-400" />
              <span className="text-xs bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded-full">
                Pending
              </span>
            </div>
            <div className="text-3xl font-bold">
              $
              {userEarnings === null || userEarnings === void 0
                ? void 0
                : userEarnings.pendingEarnings.toFixed(2)}
            </div>
            <div className="text-sm text-white/60">Pending Payment</div>
          </div>

          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <lucide_react_1.Calendar className="w-8 h-8 text-blue-400" />
              <span className="text-xs text-blue-300">This Month</span>
            </div>
            <div className="text-3xl font-bold">
              $
              {userEarnings === null || userEarnings === void 0
                ? void 0
                : userEarnings.thisMonth.toFixed(2)}
            </div>
            <div className="text-sm text-white/60">Monthly Earnings</div>
          </div>

          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <lucide_react_1.BarChart3 className="w-8 h-8 text-purple-400" />
              <span className="text-xs text-purple-300">
                {userEarnings === null || userEarnings === void 0
                  ? void 0
                  : userEarnings.activeOpportunities}{" "}
                Active
              </span>
            </div>
            <div className="text-3xl font-bold">
              {userEarnings === null || userEarnings === void 0
                ? void 0
                : userEarnings.transactionCount}
            </div>
            <div className="text-sm text-white/60">Total Transactions</div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <lucide_react_1.CreditCard className="w-6 h-6 mr-2" />
            Payment Methods
          </h3>
          <div className="space-y-3">
            {userEarnings === null || userEarnings === void 0
              ? void 0
              : userEarnings.paymentMethods.methods.map(function (method) {
                  return (
                    <div
                      key={method.id}
                      className={"flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ".concat(
                        method.id === userEarnings.paymentMethods.default
                          ? "bg-blue-500/20 border-blue-400/30"
                          : "bg-white/5 border-white/10",
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-white/20">
                          {method.type === "paypal" && (
                            <lucide_react_1.Wallet className="w-5 h-5" />
                          )}
                          {method.type === "bank" && (
                            <lucide_react_1.Banknote className="w-5 h-5" />
                          )}
                          {method.type === "crypto" && (
                            <lucide_react_1.DollarSign className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-white/60">
                            {method.details}
                          </div>
                        </div>
                      </div>
                      {method.id === userEarnings.paymentMethods.default && (
                        <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  );
                })}
          </div>
          <button className="w-full mt-4 p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300">
            Add Payment Method
          </button>
        </div>
      </div>
    );
  };
  var renderSettings = function () {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <lucide_react_1.Shield className="w-6 h-6 mr-2" />
            Data Consent Settings
          </h3>
          <div className="space-y-4">
            {Object.entries(consentSettings).map(function (_a) {
              var category = _a[0],
                settings = _a[1];
              return (
                <div
                  key={category}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium capitalize">
                        {category.replace("_", " ")}
                      </h4>
                      <p className="text-sm text-white/60">
                        Control how this data category is shared
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={function () {
                          return setConsentSettings(function (prev) {
                            var _a;
                            return __assign(
                              __assign({}, prev),
                              ((_a = {}),
                              (_a[category] = __assign(
                                __assign({}, prev[category]),
                                { enabled: !prev[category].enabled },
                              )),
                              _a),
                            );
                          });
                        }}
                        className={"w-12 h-6 rounded-full transition-all duration-300 ".concat(
                          settings.enabled ? "bg-green-500" : "bg-gray-600",
                        )}
                      >
                        <div
                          className={"w-5 h-5 bg-white rounded-full transition-transform duration-300 ".concat(
                            settings.enabled
                              ? "translate-x-6"
                              : "translate-x-0.5",
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {settings.enabled && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Privacy Level
                        </label>
                        <select
                          value={settings.level}
                          onChange={function (e) {
                            return setConsentSettings(function (prev) {
                              var _a;
                              return __assign(
                                __assign({}, prev),
                                ((_a = {}),
                                (_a[category] = __assign(
                                  __assign({}, prev[category]),
                                  { level: e.target.value },
                                )),
                                _a),
                              );
                            });
                          }}
                          className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
                        >
                          <option value="basic">
                            Basic - Aggregated data only
                          </option>
                          <option value="enhanced">
                            Enhanced - Anonymized individual data
                          </option>
                          <option value="maximum">
                            Maximum - Full anonymization + encryption
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Maximum Duration (days)
                        </label>
                        <input
                          type="number"
                          value={settings.maxDuration}
                          onChange={function (e) {
                            return setConsentSettings(function (prev) {
                              var _a;
                              return __assign(
                                __assign({}, prev),
                                ((_a = {}),
                                (_a[category] = __assign(
                                  __assign({}, prev[category]),
                                  { maxDuration: parseInt(e.target.value) },
                                )),
                                _a),
                              );
                            });
                          }}
                          className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
                          min="1"
                          max="365"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.autoConsent}
                          onChange={function (e) {
                            return setConsentSettings(function (prev) {
                              var _a;
                              return __assign(
                                __assign({}, prev),
                                ((_a = {}),
                                (_a[category] = __assign(
                                  __assign({}, prev[category]),
                                  { autoConsent: e.target.checked },
                                )),
                                _a),
                              );
                            });
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <label className="text-sm">
                          Auto-consent to similar opportunities
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center">
            <lucide_react_1.DollarSign className="w-10 h-10 mr-3 text-green-400" />
            Data Dividend Marketplace
          </h1>
          <p className="text-white/70 text-lg">
            Own your data. Share ethically. Earn fairly. Shape the future.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-white/10 rounded-lg p-1">
          {[
            {
              key: "marketplace",
              label: "Marketplace",
              icon: <lucide_react_1.Globe className="w-5 h-5" />,
            },
            {
              key: "earnings",
              label: "My Earnings",
              icon: <lucide_react_1.TrendingUp className="w-5 h-5" />,
            },
            {
              key: "settings",
              label: "Privacy Settings",
              icon: <lucide_react_1.Shield className="w-5 h-5" />,
            },
          ].map(function (_a) {
            var key = _a.key,
              label = _a.label,
              icon = _a.icon;
            return (
              <button
                key={key}
                onClick={function () {
                  return setActiveTab(key);
                }}
                className={"flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ".concat(
                  activeTab === key
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "text-white/70 hover:text-white hover:bg-white/10",
                )}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <framer_motion_1.AnimatePresence mode="wait">
          <framer_motion_1.motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "marketplace" && renderMarketplace()}
            {activeTab === "earnings" && renderEarnings()}
            {activeTab === "settings" && renderSettings()}
          </framer_motion_1.motion.div>
        </framer_motion_1.AnimatePresence>

        {/* Opportunity Detail Modal */}
        <framer_motion_1.AnimatePresence>
          {selectedOpportunity && (
            <framer_motion_1.motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={function () {
                return setSelectedOpportunity(null);
              }}
            >
              <framer_motion_1.motion.div
                className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={function (e) {
                  return e.stopPropagation();
                }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {selectedOpportunity.title}
                    </h2>
                    <p className="text-white/70">
                      {selectedOpportunity.partnerName}
                    </p>
                  </div>
                  <button
                    onClick={function () {
                      return setSelectedOpportunity(null);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <lucide_react_1.XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-white/80">
                      {selectedOpportunity.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Compensation</h3>
                      <div className="p-4 rounded-lg bg-green-500/20 border border-green-400/30">
                        <div className="flex items-center space-x-2 text-green-400 font-bold text-xl">
                          {getCompensationIcon(
                            selectedOpportunity.compensation.type,
                          )}
                          <span>
                            ${selectedOpportunity.compensation.amount}
                          </span>
                        </div>
                        <p className="text-sm text-green-300">
                          {selectedOpportunity.compensation.description}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Privacy & Security</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Privacy Level:</span>
                          <span className="font-medium capitalize">
                            {selectedOpportunity.privacyLevel}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Transparency Score:</span>
                          <span className="font-medium">
                            {selectedOpportunity.transparencyScore}/100
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Duration:</span>
                          <span className="font-medium">
                            {selectedOpportunity.duration} days
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Benefits</h3>
                    <ul className="space-y-1">
                      {selectedOpportunity.benefits.map(
                        function (benefit, index) {
                          return (
                            <li
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <lucide_react_1.CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-white/80">{benefit}</span>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Requirements</h3>
                    <ul className="space-y-1">
                      {selectedOpportunity.requirements.map(
                        function (requirement, index) {
                          return (
                            <li
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <lucide_react_1.Info className="w-4 h-4 text-blue-400" />
                              <span className="text-white/80">
                                {requirement}
                              </span>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  </div>

                  {selectedOpportunity.impact && (
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <h3 className="font-semibold mb-2 flex items-center">
                        {getImpactIcon(selectedOpportunity.impact.type)}
                        <span className="ml-2">Impact</span>
                      </h3>
                      <p className="text-white/80 mb-2">
                        {selectedOpportunity.impact.description}
                      </p>
                      {selectedOpportunity.impact.metrics && (
                        <p className="text-sm text-white/60">
                          Expected Impact: {selectedOpportunity.impact.metrics}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      onClick={function () {
                        return handleJoinOpportunity(selectedOpportunity);
                      }}
                      className="flex-1 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
                    >
                      Join Opportunity
                    </button>
                    <button
                      onClick={function () {
                        return setSelectedOpportunity(null);
                      }}
                      className="px-6 py-4 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </framer_motion_1.motion.div>
            </framer_motion_1.motion.div>
          )}
        </framer_motion_1.AnimatePresence>
      </div>
    </div>
  );
};
exports.default = DataDividendMarketplace;
