"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var card_1 = require("./ui/card");
var button_1 = require("./ui/button");
var badge_1 = require("./ui/badge");
var switch_1 = require("./ui/switch");
var tabs_1 = require("./ui/tabs");
var lucide_react_1 = require("lucide-react");
var roadmapService_1 = require("../lib/roadmapService");
var DataDividendPanel = function () {
  var _a;
  var _b = (0, react_1.useState)("consent"),
    activeTab = _b[0],
    setActiveTab = _b[1];
  var _c = (0, react_1.useState)(true),
    loading = _c[0],
    setLoading = _c[1];
  var _d = (0, react_1.useState)(null),
    error = _d[0],
    setError = _d[1];
  var _e = (0, react_1.useState)([]),
    classifications = _e[0],
    setClassifications = _e[1];
  var _f = (0, react_1.useState)([]),
    partners = _f[0],
    setPartners = _f[1];
  var _g = (0, react_1.useState)([]),
    userConsent = _g[0],
    setUserConsent = _g[1];
  var _h = (0, react_1.useState)(null),
    compensation = _h[0],
    setCompensation = _h[1];
  // Mock user ID for demo purposes
  var userId = "user-123";
  (0, react_1.useEffect)(function () {
    fetchData();
  }, []);
  var fetchData = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var _a,
        classificationsData,
        partnersData,
        consentData,
        compensationData,
        err_1;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            setLoading(true);
            setError(null);
            _b.label = 1;
          case 1:
            _b.trys.push([1, 3, 4, 5]);
            return [
              4 /*yield*/,
              Promise.all([
                roadmapService_1.default.getDataClassifications(),
                roadmapService_1.default.getDataPartners(),
                roadmapService_1.default.getUserConsent(userId),
                roadmapService_1.default.getUserCompensation(userId),
              ]),
            ];
          case 2:
            ((_a = _b.sent()),
              (classificationsData = _a[0]),
              (partnersData = _a[1]),
              (consentData = _a[2]),
              (compensationData = _a[3]));
            setClassifications(classificationsData.classifications || []);
            setPartners(partnersData.partners || []);
            setUserConsent(consentData.consent || []);
            setCompensation(compensationData.summary || null);
            return [3 /*break*/, 5];
          case 3:
            err_1 = _b.sent();
            console.error("Error fetching data dividend information:", err_1);
            setError("Failed to load data dividend information");
            return [3 /*break*/, 5];
          case 4:
            setLoading(false);
            return [7 /*endfinally*/];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  var updateConsent = function (dataCategory, granted) {
    return __awaiter(void 0, void 0, void 0, function () {
      var purposes, partnerIds, consentData, err_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, , 4]);
            purposes = ["research", "product_improvement"];
            partnerIds = partners.slice(0, 2).map(function (p) {
              return p.partnerId;
            });
            return [
              4 /*yield*/,
              roadmapService_1.default.updateUserConsent(
                userId,
                dataCategory,
                granted,
                purposes,
                partnerIds,
              ),
            ];
          case 1:
            _a.sent();
            return [
              4 /*yield*/,
              roadmapService_1.default.getUserConsent(userId),
            ];
          case 2:
            consentData = _a.sent();
            setUserConsent(consentData.consent || []);
            return [3 /*break*/, 4];
          case 3:
            err_2 = _a.sent();
            console.error("Error updating consent:", err_2);
            setError("Failed to update consent");
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  if (loading) {
    return (
      <card_1.Card className="w-full bg-gray-800/50 border-gray-700">
        <card_1.CardHeader>
          <card_1.CardTitle>Data Dividend Framework</card_1.CardTitle>
          <card_1.CardDescription>
            Loading data dividend information...
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="flex justify-center py-8">
          <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </card_1.CardContent>
      </card_1.Card>
    );
  }
  if (error) {
    return (
      <card_1.Card className="w-full bg-gray-800/50 border-gray-700">
        <card_1.CardHeader>
          <card_1.CardTitle>Data Dividend Framework</card_1.CardTitle>
          <card_1.CardDescription>
            Error loading data dividend information
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="text-red-400">{error}</div>
        </card_1.CardContent>
        <card_1.CardFooter>
          <button_1.Button onClick={fetchData}>Retry</button_1.Button>
        </card_1.CardFooter>
      </card_1.Card>
    );
  }
  return (
    <card_1.Card className="w-full bg-gray-800/50 border-gray-700">
      <card_1.CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <card_1.CardTitle>Data Dividend Framework</card_1.CardTitle>
            <card_1.CardDescription>
              Creating an ethical system for user data ownership and
              monetization
            </card_1.CardDescription>
          </div>
        </div>
      </card_1.CardHeader>
      <card_1.CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <card_1.Card className="bg-gray-800/30 border-gray-700">
            <card_1.CardHeader className="pb-2">
              <card_1.CardTitle className="text-sm flex items-center">
                <lucide_react_1.Database className="mr-2 h-4 w-4" />
                Data Categories
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-2xl font-bold">{classifications.length}</div>
              <p className="text-xs text-gray-400">
                Classified data categories
              </p>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card className="bg-gray-800/30 border-gray-700">
            <card_1.CardHeader className="pb-2">
              <card_1.CardTitle className="text-sm flex items-center">
                <lucide_react_1.Shield className="mr-2 h-4 w-4" />
                Consent Rate
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-2xl font-bold">
                {
                  userConsent.filter(function (c) {
                    return c.granted;
                  }).length
                }{" "}
                / {classifications.length}
              </div>
              <p className="text-xs text-gray-400">
                Categories with active consent
              </p>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card className="bg-gray-800/30 border-gray-700">
            <card_1.CardHeader className="pb-2">
              <card_1.CardTitle className="text-sm flex items-center">
                <lucide_react_1.DollarSign className="mr-2 h-4 w-4" />
                Total Earnings
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-2xl font-bold">
                $
                {((_a =
                  compensation === null || compensation === void 0
                    ? void 0
                    : compensation.totalEarnings) === null || _a === void 0
                  ? void 0
                  : _a.toFixed(2)) || "0.00"}
              </div>
              <p className="text-xs text-gray-400">Earned from data sharing</p>
            </card_1.CardContent>
          </card_1.Card>
        </div>

        <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab}>
          <tabs_1.TabsList className="grid grid-cols-3 mb-4">
            <tabs_1.TabsTrigger value="consent">
              Consent Management
            </tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="partners">
              Data Partners
            </tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="earnings">Earnings</tabs_1.TabsTrigger>
          </tabs_1.TabsList>

          <tabs_1.TabsContent value="consent" className="space-y-4">
            <div className="space-y-4">
              {classifications.map(function (classification, index) {
                var consentRecord = userConsent.find(function (c) {
                  return c.dataCategory === classification.category;
                });
                var isConsented =
                  (consentRecord === null || consentRecord === void 0
                    ? void 0
                    : consentRecord.granted) || false;
                return (
                  <div
                    key={index}
                    className="border border-gray-700 rounded-md p-3"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="text-sm font-medium">
                          {classification.category}
                        </span>
                        <badge_1.Badge
                          className={
                            classification.privacyImpact === "low"
                              ? "bg-green-600 ml-2"
                              : classification.privacyImpact === "medium"
                                ? "bg-amber-600 ml-2"
                                : "bg-red-600 ml-2"
                          }
                        >
                          {classification.privacyImpact}
                        </badge_1.Badge>
                      </div>
                      <switch_1.Switch
                        checked={isConsented}
                        onCheckedChange={function (checked) {
                          return updateConsent(
                            classification.category,
                            checked,
                          );
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      {classification.description}
                    </p>
                    <div className="flex justify-between mt-2 text-xs">
                      <span className="text-gray-400">
                        Value: $
                        {(classification.monetizationValue / 100).toFixed(2)}
                        /month
                      </span>
                      <span className="text-gray-400">
                        Retention: {classification.retentionPeriod} days
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="partners" className="space-y-4">
            {partners.length > 0 ? (
              <div className="space-y-3">
                {partners.map(function (partner, index) {
                  return (
                    <div
                      key={index}
                      className="border border-gray-700 rounded-md p-3"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">
                          {partner.name}
                        </span>
                        <badge_1.Badge
                          className={
                            partner.type === "research"
                              ? "bg-blue-600"
                              : partner.type === "nonprofit"
                                ? "bg-green-600"
                                : "bg-purple-600"
                          }
                        >
                          {partner.type}
                        </badge_1.Badge>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>
                          Contract:{" "}
                          {new Date(partner.contractStart).toLocaleDateString()}{" "}
                          - {new Date(partner.contractEnd).toLocaleDateString()}
                        </span>
                        <badge_1.Badge variant="outline">
                          {partner.status}
                        </badge_1.Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {partner.approvedCategories.map(function (category, i) {
                          return (
                            <badge_1.Badge
                              key={i}
                              variant="outline"
                              className="text-xs"
                            >
                              {category}
                            </badge_1.Badge>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-gray-700 rounded-md p-4 text-center text-gray-400">
                No data partners available
              </div>
            )}
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="earnings" className="space-y-4">
            {compensation ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <card_1.Card className="bg-gray-800/30 border-gray-700">
                    <card_1.CardHeader className="pb-2">
                      <card_1.CardTitle className="text-xs">
                        Total Earnings
                      </card_1.CardTitle>
                    </card_1.CardHeader>
                    <card_1.CardContent>
                      <div className="text-xl font-bold">
                        ${compensation.totalEarnings.toFixed(2)}
                      </div>
                    </card_1.CardContent>
                  </card_1.Card>
                  <card_1.Card className="bg-gray-800/30 border-gray-700">
                    <card_1.CardHeader className="pb-2">
                      <card_1.CardTitle className="text-xs">
                        Pending Earnings
                      </card_1.CardTitle>
                    </card_1.CardHeader>
                    <card_1.CardContent>
                      <div className="text-xl font-bold">
                        ${compensation.pendingEarnings.toFixed(2)}
                      </div>
                    </card_1.CardContent>
                  </card_1.Card>
                  <card_1.Card className="bg-gray-800/30 border-gray-700">
                    <card_1.CardHeader className="pb-2">
                      <card_1.CardTitle className="text-xs">
                        Transactions
                      </card_1.CardTitle>
                    </card_1.CardHeader>
                    <card_1.CardContent>
                      <div className="text-xl font-bold">
                        {compensation.transactionCount}
                      </div>
                    </card_1.CardContent>
                  </card_1.Card>
                </div>

                <div className="border border-gray-700 rounded-md p-3">
                  <h4 className="text-sm font-medium mb-2">
                    Earnings by Category
                  </h4>
                  {Object.entries(compensation.byCategory).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(compensation.byCategory).map(
                        function (_a, index) {
                          var category = _a[0],
                            data = _a[1];
                          return (
                            <div
                              key={index}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm">{category}</span>
                              <div className="flex items-center">
                                <span className="text-sm mr-2">
                                  ${data.earnings.toFixed(2)}
                                </span>
                                <badge_1.Badge
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {data.transactionCount} tx
                                </badge_1.Badge>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      No category earnings yet
                    </p>
                  )}
                </div>

                <div className="border border-gray-700 rounded-md p-3">
                  <h4 className="text-sm font-medium mb-2">
                    Earnings by Partner
                  </h4>
                  {Object.entries(compensation.byPartner).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(compensation.byPartner).map(
                        function (_a, index) {
                          var partnerId = _a[0],
                            data = _a[1];
                          var partner = partners.find(function (p) {
                            return p.partnerId === partnerId;
                          });
                          return (
                            <div
                              key={index}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm">
                                {(partner === null || partner === void 0
                                  ? void 0
                                  : partner.name) || partnerId}
                              </span>
                              <div className="flex items-center">
                                <span className="text-sm mr-2">
                                  ${data.earnings.toFixed(2)}
                                </span>
                                <badge_1.Badge
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {data.transactionCount} tx
                                </badge_1.Badge>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      No partner earnings yet
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="border border-gray-700 rounded-md p-4 text-center text-gray-400">
                No earnings data available
              </div>
            )}
          </tabs_1.TabsContent>
        </tabs_1.Tabs>
      </card_1.CardContent>
      <card_1.CardFooter className="flex justify-between border-t border-gray-700 pt-4">
        <span className="text-xs text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
        <button_1.Button variant="outline" size="sm" onClick={fetchData}>
          Refresh
        </button_1.Button>
      </card_1.CardFooter>
    </card_1.Card>
  );
};
exports.default = DataDividendPanel;
