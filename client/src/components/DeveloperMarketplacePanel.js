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
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var card_1 = require("./ui/card");
var button_1 = require("./ui/button");
var badge_1 = require("./ui/badge");
var input_1 = require("./ui/input");
var tabs_1 = require("./ui/tabs");
var lucide_react_1 = require("lucide-react");
var roadmapService_1 = require("../lib/roadmapService");
var DeveloperMarketplacePanel = function () {
  var _a = (0, react_1.useState)("featured"),
    activeTab = _a[0],
    setActiveTab = _a[1];
  var _b = (0, react_1.useState)(true),
    loading = _b[0],
    setLoading = _b[1];
  var _c = (0, react_1.useState)(false),
    searching = _c[0],
    setSearching = _c[1];
  var _d = (0, react_1.useState)(null),
    installing = _d[0],
    setInstalling = _d[1];
  var _e = (0, react_1.useState)(null),
    error = _e[0],
    setError = _e[1];
  var _f = (0, react_1.useState)(""),
    searchQuery = _f[0],
    setSearchQuery = _f[1];
  var _g = (0, react_1.useState)([]),
    featuredExtensions = _g[0],
    setFeaturedExtensions = _g[1];
  var _h = (0, react_1.useState)([]),
    searchResults = _h[0],
    setSearchResults = _h[1];
  var _j = (0, react_1.useState)([]),
    installedExtensions = _j[0],
    setInstalledExtensions = _j[1];
  // Mock user ID for demo purposes
  var userId = "user-123";
  (0, react_1.useEffect)(function () {
    fetchData();
  }, []);
  var fetchData = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var featured, err_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setLoading(true);
            setError(null);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            return [
              4 /*yield*/,
              roadmapService_1.default.getFeaturedExtensions(10),
            ];
          case 2:
            featured = _a.sent();
            setFeaturedExtensions(featured.extensions || []);
            // In a real implementation, we would fetch the user's installed extensions
            // For now, just use an empty array
            setInstalledExtensions([]);
            return [3 /*break*/, 5];
          case 3:
            err_1 = _a.sent();
            console.error("Error fetching marketplace data:", err_1);
            setError("Failed to load marketplace data");
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
  var searchExtensions = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var results, err_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!searchQuery.trim()) return [2 /*return*/];
            setSearching(true);
            setError(null);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            return [
              4 /*yield*/,
              roadmapService_1.default.searchExtensions(searchQuery),
            ];
          case 2:
            results = _a.sent();
            setSearchResults(results.results || []);
            setActiveTab("search");
            return [3 /*break*/, 5];
          case 3:
            err_2 = _a.sent();
            console.error("Error searching extensions:", err_2);
            setError("Failed to search extensions");
            return [3 /*break*/, 5];
          case 4:
            setSearching(false);
            return [7 /*endfinally*/];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  var installExtension = function (extensionId) {
    return __awaiter(void 0, void 0, void 0, function () {
      var extension_1, err_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            setInstalling(extensionId);
            setError(null);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            return [
              4 /*yield*/,
              roadmapService_1.default.installExtension(userId, extensionId),
            ];
          case 2:
            _a.sent();
            extension_1 = __spreadArray(
              __spreadArray([], featuredExtensions, true),
              searchResults,
              true,
            ).find(function (e) {
              return e.id === extensionId;
            });
            if (extension_1) {
              setInstalledExtensions(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  [
                    __assign(__assign({}, extension_1), {
                      installDate: new Date(),
                      status: "active",
                    }),
                  ],
                  false,
                );
              });
            }
            return [3 /*break*/, 5];
          case 3:
            err_3 = _a.sent();
            console.error("Error installing extension:", err_3);
            setError("Failed to install extension: ".concat(extensionId));
            return [3 /*break*/, 5];
          case 4:
            setInstalling(null);
            return [7 /*endfinally*/];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  var handleSearchKeyDown = function (e) {
    if (e.key === "Enter") {
      searchExtensions();
    }
  };
  if (loading) {
    return (
      <card_1.Card className="w-full bg-gray-800/50 border-gray-700">
        <card_1.CardHeader>
          <card_1.CardTitle>Developer Marketplace</card_1.CardTitle>
          <card_1.CardDescription>
            Loading marketplace data...
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
          <card_1.CardTitle>Developer Marketplace</card_1.CardTitle>
          <card_1.CardDescription>
            Error loading marketplace data
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
  var renderExtensionCard = function (extension) {
    var isInstalled = installedExtensions.some(function (e) {
      return e.id === extension.id;
    });
    return (
      <card_1.Card
        key={extension.id}
        className="bg-gray-800/30 border-gray-700"
      >
        <card_1.CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <card_1.CardTitle className="text-sm">
              {extension.name}
            </card_1.CardTitle>
            <badge_1.Badge
              className={
                extension.pricing.model === "free"
                  ? "bg-green-600"
                  : extension.pricing.model === "one-time"
                    ? "bg-blue-600"
                    : "bg-purple-600"
              }
            >
              {extension.pricing.model}
              {extension.pricing.price
                ? " $".concat(extension.pricing.price)
                : ""}
            </badge_1.Badge>
          </div>
          <card_1.CardDescription className="line-clamp-2 text-xs">
            {extension.description}
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="pb-2">
          <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
            <span>{extension.developerName}</span>
            <div className="flex items-center">
              <lucide_react_1.Star className="h-3 w-3 text-yellow-400 mr-1" />
              <span>
                {extension.rating.average.toFixed(1)} ({extension.rating.count})
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {extension.tags.slice(0, 3).map(function (tag, i) {
              return (
                <badge_1.Badge key={i} variant="outline" className="text-xs">
                  {tag}
                </badge_1.Badge>
              );
            })}
            {extension.tags.length > 3 && (
              <badge_1.Badge variant="outline" className="text-xs">
                +{extension.tags.length - 3}
              </badge_1.Badge>
            )}
          </div>
        </card_1.CardContent>
        <card_1.CardFooter className="pt-0">
          <button_1.Button
            className="w-full"
            variant={isInstalled ? "outline" : "default"}
            disabled={installing === extension.id}
            onClick={function () {
              return !isInstalled && installExtension(extension.id);
            }}
          >
            {installing === extension.id ? (
              <>
                <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Installing...
              </>
            ) : isInstalled ? (
              "Installed"
            ) : (
              <>
                <lucide_react_1.Download className="mr-2 h-4 w-4" />
                Install
              </>
            )}
          </button_1.Button>
        </card_1.CardFooter>
      </card_1.Card>
    );
  };
  return (
    <card_1.Card className="w-full bg-gray-800/50 border-gray-700">
      <card_1.CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <card_1.CardTitle>Developer Marketplace</card_1.CardTitle>
            <card_1.CardDescription>
              Building a platform for third-party extensions and innovations
            </card_1.CardDescription>
          </div>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <input_1.Input
              type="text"
              placeholder="Search extensions..."
              value={searchQuery}
              onChange={function (e) {
                return setSearchQuery(e.target.value);
              }}
              onKeyDown={handleSearchKeyDown}
            />
            <button_1.Button
              onClick={searchExtensions}
              disabled={searching || !searchQuery.trim()}
            >
              {searching ? (
                <lucide_react_1.Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <lucide_react_1.Search className="h-4 w-4" />
              )}
            </button_1.Button>
          </div>
        </div>
      </card_1.CardHeader>
      <card_1.CardContent>
        <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab}>
          <tabs_1.TabsList className="grid grid-cols-3 mb-4">
            <tabs_1.TabsTrigger value="featured">Featured</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="installed">Installed</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger
              value="search"
              disabled={searchResults.length === 0}
            >
              Search Results
            </tabs_1.TabsTrigger>
          </tabs_1.TabsList>

          <tabs_1.TabsContent value="featured" className="space-y-4">
            {featuredExtensions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredExtensions.map(function (extension) {
                  return renderExtensionCard(extension);
                })}
              </div>
            ) : (
              <div className="border border-gray-700 rounded-md p-4 text-center text-gray-400">
                No featured extensions available
              </div>
            )}
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="installed" className="space-y-4">
            {installedExtensions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {installedExtensions.map(function (extension) {
                  return (
                    <card_1.Card
                      key={extension.id}
                      className="bg-gray-800/30 border-gray-700"
                    >
                      <card_1.CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <card_1.CardTitle className="text-sm">
                            {extension.name}
                          </card_1.CardTitle>
                          <badge_1.Badge className="bg-green-600">
                            Installed
                          </badge_1.Badge>
                        </div>
                        <card_1.CardDescription className="line-clamp-2 text-xs">
                          {extension.description}
                        </card_1.CardDescription>
                      </card_1.CardHeader>
                      <card_1.CardContent className="pb-2">
                        <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
                          <span>{extension.developerName}</span>
                          <span>v{extension.version}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <span>
                            Installed:{" "}
                            {new Date(
                              extension.installDate,
                            ).toLocaleDateString()}
                          </span>
                          <badge_1.Badge
                            variant="outline"
                            className={
                              extension.status === "active"
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {extension.status}
                          </badge_1.Badge>
                        </div>
                      </card_1.CardContent>
                      <card_1.CardFooter className="pt-0 flex justify-between">
                        <button_1.Button variant="outline" size="sm">
                          Settings
                        </button_1.Button>
                        <button_1.Button
                          variant="outline"
                          size="sm"
                          className="text-red-400"
                        >
                          Disable
                        </button_1.Button>
                      </card_1.CardFooter>
                    </card_1.Card>
                  );
                })}
              </div>
            ) : (
              <div className="border border-gray-700 rounded-md p-4 text-center text-gray-400">
                No extensions installed
              </div>
            )}
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="search" className="space-y-4">
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {searchResults.map(function (extension) {
                  return renderExtensionCard(extension);
                })}
              </div>
            ) : (
              <div className="border border-gray-700 rounded-md p-4 text-center text-gray-400">
                No search results
              </div>
            )}
          </tabs_1.TabsContent>
        </tabs_1.Tabs>
      </card_1.CardContent>
      <card_1.CardFooter className="flex justify-between border-t border-gray-700 pt-4">
        <div className="flex items-center text-xs text-gray-400">
          <lucide_react_1.Tag className="h-4 w-4 mr-1" />
          <span>Categories: </span>
          <div className="flex ml-2 gap-2">
            <badge_1.Badge variant="outline" className="text-xs">
              Smart Home
            </badge_1.Badge>
            <badge_1.Badge variant="outline" className="text-xs">
              Security
            </badge_1.Badge>
            <badge_1.Badge variant="outline" className="text-xs">
              Entertainment
            </badge_1.Badge>
            <badge_1.Badge variant="outline" className="text-xs">
              +5 more
            </badge_1.Badge>
          </div>
        </div>
        <button_1.Button variant="outline" size="sm" onClick={fetchData}>
          Refresh
        </button_1.Button>
      </card_1.CardFooter>
    </card_1.Card>
  );
};
exports.default = DeveloperMarketplacePanel;
