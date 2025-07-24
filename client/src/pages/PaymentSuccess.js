"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PaymentSuccess;
var react_1 = require("react");
var wouter_1 = require("wouter");
var lucide_react_1 = require("lucide-react");
var button_1 = require("@/components/ui/button");
var card_1 = require("@/components/ui/card");
var react_query_1 = require("@tanstack/react-query");
function PaymentSuccess() {
  var queryClient = (0, react_query_1.useQueryClient)();
  // Invalidate subscription queries when the page loads
  (0, react_1.useEffect)(
    function () {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    },
    [queryClient],
  );
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0D1117] text-white p-6">
      <card_1.Card className="w-full max-w-md bg-[#1A1A1A] border border-[#00FF00] text-white">
        <card_1.CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-[#00FF00]/10 flex items-center justify-center">
            <lucide_react_1.CheckCircle className="w-10 h-10 text-[#00FF00]" />
          </div>
          <card_1.CardTitle className="text-2xl text-[#00FF00]">
            SUBSCRIPTION ACTIVATED
          </card_1.CardTitle>
          <card_1.CardDescription className="text-gray-400">
            Thank you for subscribing to JASON!
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-4">
          <div className="p-4 bg-[#0D1117] rounded-md text-gray-300">
            <p className="mb-2">You now have access to:</p>
            <ul className="space-y-2">
              <li className="flex items-start">
                <lucide_react_1.CheckCircle className="w-5 h-5 mr-2 text-[#00FF00] mt-0.5" />
                <span>Advanced neural adaptation capabilities</span>
              </li>
              <li className="flex items-start">
                <lucide_react_1.CheckCircle className="w-5 h-5 mr-2 text-[#00FF00] mt-0.5" />
                <span>Enhanced quantum security features</span>
              </li>
              <li className="flex items-start">
                <lucide_react_1.CheckCircle className="w-5 h-5 mr-2 text-[#00FF00] mt-0.5" />
                <span>Priority support and updates</span>
              </li>
            </ul>
          </div>

          <div className="text-center text-sm text-gray-400">
            A confirmation email with your subscription details has been sent to
            your email address.
          </div>
        </card_1.CardContent>
        <card_1.CardFooter className="flex justify-center">
          <button_1.Button
            className="bg-[#00FFFF] hover:bg-[#00FFFF]/80 text-black"
            asChild
          >
            <wouter_1.Link href="/">
              <lucide_react_1.ArrowLeft className="w-4 h-4 mr-2" /> Back to
              Dashboard
            </wouter_1.Link>
          </button_1.Button>
        </card_1.CardFooter>
      </card_1.Card>
    </div>
  );
}
