const { UniversalAppController } = require('./server/services/universal/UniversalAppController');
try {
    console.log("Attempting to initialize UniversalAppController...");
    const ctrl = new UniversalAppController();
    console.log("Successfully initialized!");
    console.log("Workspace:", ctrl.workspace);
} catch (e) {
    console.error("Initialization Failed:");
    console.error(e);
}
