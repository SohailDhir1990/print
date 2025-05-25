const express = require("express");
const bodyParser = require("body-parser");
const usb = require("usb");
const cors = require("cors");
const sharp = require("sharp");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

function findPrinter() {
  const devices = usb.getDeviceList();
  for (const device of devices) {
    const deviceDesc = device.deviceDescriptor;
    if (deviceDesc.idVendor === 0x1203) {
      return device;
    }
  }
  return null;
}

function sendPrintCommand(command) {
  const printer = findPrinter();
  if (!printer) {
    console.log("Printer not found. Make sure it is connected and powered on.");
    return;
  }

  printer.open();

  const iface = printer.interfaces[0];
  if (iface.isKernelDriverActive()) {
    iface.detachKernelDriver();
  }

  iface.claim();

  const outEndpoint = iface.endpoints.find((e) => e.direction === "out");

  if (!outEndpoint) {
    console.log("No OUT endpoint found on printer");
    return;
  }

  outEndpoint.transfer(Buffer.from(command), (err) => {
    if (err) {
      console.error("Error sending data:", err);
    } else {
      console.log("Print command sent successfully!");
    }
    iface.release(true, () => printer.close());
  });
}

app.post("/print", (req, res) => {
  const { labelData } = req.body;

  if (!labelData) {
    return res
      .status(400)
      .send({ success: false, error: "No labelData provided" });
  }

  try {
    sendPrintCommand(labelData);
    res.send({ success: true });
  } catch (error) {
    console.error("Error in /print endpoint:", error);
    res.status(500).send({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Printer API running on http://localhost:${PORT}`);
});
