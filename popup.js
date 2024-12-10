let gazeDataArray = [];
let trackingTimeout;

GazeCloudAPI.OnResult = function (gazeData) {
    if (gazeData.state === 0) {
        gazeDataArray.push({ x: gazeData.docX, y: gazeData.docY, value: 1 });
    }
};

GazeCloudAPI.OnCalibrationComplete = async function () {
    console.log("Calibration Complete");
    document.getElementById("startButton").disabled = true;

    // Capture initial background image
    const backgroundUrl = await captureScreenshot();
    setBackgroundImage(backgroundUrl);

    // Stop after 15 seconds
    trackingTimeout = setTimeout(() => stopGazeTracking(), 15000);
};

GazeCloudAPI.OnError = function (msg) {
    console.error("GazeCloudAPI Error:", msg);
};


function stopGazeTracking() {
    GazeCloudAPI.StopEyeTracking();
    console.log("Stopped gaze tracking.");
    clearTimeout(trackingTimeout);
    generateHeatmap();
}

async function captureScreenshot() {
    return new Promise((resolve, reject) => {
        chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
            } else {
                resolve(dataUrl);
            }
        });
    });
}

function setBackgroundImage(imageUrl) {
    const imgElement = document.getElementById("backgroundImage");
    imgElement.src = imageUrl;
}

async function generateHeatmap() {
    const canvas = document.getElementById("heatmapCanvas");
    const ctx = canvas.getContext("2d");
    const heatmapInstance = h337.create({ container: canvas.parentNode });

    heatmapInstance.setData({ max: 10, data: gazeDataArray });
    ctx.drawImage(heatmapInstance._renderer.canvas, 0, 0, canvas.width, canvas.height);

    saveHeatmap(canvas);
}

function saveHeatmap(canvas) {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "heatmap_overlay.png";
    link.click();
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("startButton").addEventListener("click", ()=> {GazeCloudAPI.StartEyeTracking();});
});
