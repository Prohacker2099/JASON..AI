"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var ServiceIntegrationPanel_1 = require("../components/ServiceIntegrationPanel");
var card_1 = require("../components/ui/card");
var Integrations = function () {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Service Integrations</h1>

      <div className="grid grid-cols-1 gap-6">
        <ServiceIntegrationPanel_1.default />

        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Connected Services</card_1.CardTitle>
            <card_1.CardDescription>
              Manage your connected services and devices
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <p className="text-sm text-gray-500">
              Connect to thousands of services and platforms to expand JASON's
              capabilities. JASON integrates with popular voice assistants,
              smart home platforms, and more.
            </p>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-md text-center">
                <img
                  src="/images/alexa-logo.png"
                  alt="Amazon Alexa"
                  className="h-12 mx-auto mb-2"
                  onError={function (e) {
                    e.currentTarget.src =
                      "https://via.placeholder.com/100x60?text=Alexa";
                  }}
                />
                <h3 className="font-medium">Amazon Alexa</h3>
              </div>

              <div className="p-4 border rounded-md text-center">
                <img
                  src="/images/google-assistant-logo.png"
                  alt="Google Assistant"
                  className="h-12 mx-auto mb-2"
                  onError={function (e) {
                    e.currentTarget.src =
                      "https://via.placeholder.com/100x60?text=Google";
                  }}
                />
                <h3 className="font-medium">Google Assistant</h3>
              </div>

              <div className="p-4 border rounded-md text-center">
                <img
                  src="/images/homekit-logo.png"
                  alt="Apple HomeKit"
                  className="h-12 mx-auto mb-2"
                  onError={function (e) {
                    e.currentTarget.src =
                      "https://via.placeholder.com/100x60?text=HomeKit";
                  }}
                />
                <h3 className="font-medium">Apple HomeKit</h3>
              </div>

              <div className="p-4 border rounded-md text-center">
                <img
                  src="/images/hue-logo.png"
                  alt="Philips Hue"
                  className="h-12 mx-auto mb-2"
                  onError={function (e) {
                    e.currentTarget.src =
                      "https://via.placeholder.com/100x60?text=Hue";
                  }}
                />
                <h3 className="font-medium">Philips Hue</h3>
              </div>

              <div className="p-4 border rounded-md text-center">
                <img
                  src="/images/sonos-logo.png"
                  alt="Sonos"
                  className="h-12 mx-auto mb-2"
                  onError={function (e) {
                    e.currentTarget.src =
                      "https://via.placeholder.com/100x60?text=Sonos";
                  }}
                />
                <h3 className="font-medium">Sonos</h3>
              </div>

              <div className="p-4 border rounded-md text-center">
                <img
                  src="/images/more-logo.png"
                  alt="And Many More"
                  className="h-12 mx-auto mb-2"
                  onError={function (e) {
                    e.currentTarget.src =
                      "https://via.placeholder.com/100x60?text=And+More";
                  }}
                />
                <h3 className="font-medium">And Many More</h3>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </div>
  );
};
exports.default = Integrations;
