function encodedKey(resi) {
  const key = "0ebfffe63d2a481cf57fe7d5ebdc9fd6";
  const encodedKey = Buffer.from(key).toString("base64");
  const time = Math.floor(Date.now() / 1000);
  const parameter = `${resi}|${time}${crypto
    .createHash("sha256")
    .update(resi + time + encodedKey)
    .digest("hex")}`;
  return parameter;
}

async function SPXTracking(waybill) {
  try {
    const waybillUpperCase = waybill.toUpperCase();
    const encoded = encodedKey(waybillUpperCase);
    const response = await axios.get(
      `https://spx.vn/api/v2/fleet_order/tracking/search?sls_tracking_number=${encoded}`,
      {
        headers: {
          Authority: "spx.vn",
          "Sec-Ch-Ua":
            '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
          Accept: "application/json, text/plain, */*",
          "Sec-Ch-Ua-Mobile": "?0",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.106 Safari/537.36",
          "Sec-Fetch-Site": "same-origin",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Dest": "empty",
          Referer: `https://spx.vn/detail/${waybillUpperCase}`,
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          Cookie:
            "_ga=GA1.3.1846728554.1660367856; _gid=GA1.3.864556559.1660367856; fms_language=id; _gat_UA-61904553-17=1",
        },
      }
    );
    const firstTrackingItem = response.data.data.tracking_list[0];

    const timestamp = firstTrackingItem.timestamp * 1000;
    const timeString = new Date(timestamp).toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
    const dateString = new Date(timestamp).toLocaleDateString("en-US");

    // Trả về dữ liệu mong muốn
    return {
      time: timeString,
      date: dateString,
      message: firstTrackingItem.message,
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
}

async function JNTTracking(trackingID, cellphone) {
  try {
    if (!trackingID || !cellphone) {
      throw new Error("Missing parameters: 'trackingID', or 'cellphone'.");
    }

    // Make request to JNTTracking page
    const response = await axios.get(
      `https://jtexpress.vn/vi/tracking?type=track&billcode=${trackingID}&cellphone=${cellphone}`
    );
    const html = response.data;
    const $ = cheerio.load(html);

    // Extract tab-content data
    const tabContent = $(".tab-content");
    const result = [];

    // Iterate over each item in tab-content
    tabContent.find(".result-vandon-item").each((index, element) => {
      const time = $(element).find(".SFProDisplayBold").first().text().trim();
      const message = $(element).find("div").last().text().trim();
      const date = $(element).find(".SFProDisplayBold").last().text().trim();

      result.push({
        time,
        message,
        date,
      });
    });

    return result[0];
  } catch (error) {
    console.error("Error fetching JNTTracking data:", error);
    throw new Error("Internal server error");
  }
}

async function GHNTracking(orderCode) {
  try {
    if (!orderCode) {
      throw new Error("Missing 'order_code'.");
    }

    const response = await axios.post(
      "https://fe-online-gateway.ghn.vn/order-tracking/public-api/client/tracking-logs",
      {
        order_code: orderCode,
      }
    );

    const trackingLog =
      response.data.data.tracking_logs[
      response.data.data.tracking_logs.length - 1
      ];

    const time = trackingLog.action_at.split("T")[0];
    const message = trackingLog.location.address;

    return {
      time,
      date: trackingLog.action_at.split("T")[1],
      message,
    };
  } catch (error) {
    console.error("Error tracking order:", error.message);
    throw new Error("Internal server error");
  }
}

async function NJVTracking(tracking_id) {
  try {
    if (!tracking_id) {
      throw new Error("Missing 'tracking_id'.");
    }
    const response = await axios.get(
      `https://walrus.ninjavan.co/vn/dash/1.2/public/orders?tracking_id=${tracking_id}`
    );

    // Check if events array is empty
    if (!response.data.events || response.data.events.length === 0) {
      return {
        error: "No tracking events available for the provided tracking ID.",
      };
    }

    const eventData = response.data.events[0];

    // Lấy các thông tin cần thiết
    const time = eventData.time.split("T")[1].slice(0, -1); // Lấy giờ từ thời gian
    const message = `${eventData.type} ${eventData.data.hub_name}`; // Tạo message từ type và hub_name
    const date = eventData.time.split("T")[0]; // Lấy ngày từ thời gian

    return {
      time,
      message,
      date,
    };
  } catch (error) {
    console.error("Error tracking order:", error.message);
    throw new Error("Internal server error");
  }
}

router.post("/tracking", async (req, res) => {
  try {
    const { webtracking, trackingID, cellphone } = req.body;

    if (!webtracking || !trackingID) {
      return res.status(400).json({
        error:
          "Missing 'webtracking' or 'trackingID' field in the request body.",
      });
    }

    let trackingResult;
    if (webtracking.toUpperCase() === "SPX") {
      trackingResult = await SPXTracking(trackingID);
    }
    if (webtracking.toUpperCase() === "JNT") {
      trackingResult = await JNTTracking(trackingID, cellphone);
    }
    if (webtracking.toUpperCase() === "GHN") {
      trackingResult = await GHNTracking(trackingID);
    }
    if (webtracking.toUpperCase() === "NJV") {
      trackingResult = await NJVTracking(trackingID);
    }
    // else {
    //     return res.status(400).json({
    //         error: "Unsupported webtracking type."
    //     });
    // }
    res.json({
      trackingResult,
    });
  } catch (error) {
    console.error("Error occurred while tracking:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

router.post("/trackingList", async (req, res) => {
  try {
    const { trackingList } = req.body;

    if (!trackingList || !Array.isArray(trackingList)) {
      return res.status(400).json({
        error:
          "Invalid tracking list. It should be an array of tracking objects.",
      });
    }

    const trackingResults = [];

    for (const item of trackingList) {
      const { trackingID, cellphone } = item;

      if (!trackingID) {
        trackingResults.push({
          error: "Missing 'trackingID' field in the tracking object.",
        });
        continue;
      }

      let trackingResult;

      switch (true) {
        case trackingID.startsWith("SPX") || trackingID.startsWith("VN"):
          trackingResult = await SPXTracking(trackingID);
          break;
        case cellphone && cellphone.length > 1:
          trackingResult = await JNTTracking(trackingID, cellphone);
          break;
        case trackingID.startsWith("G"):
          trackingResult = await GHNTracking(trackingID);
          break;
        case trackingID.startsWith("NJV") || trackingID.startsWith("SPE"):
          trackingResult = await NJVTracking(trackingID);
          break;
        default:
          trackingResult = {
            error: "Unsupported webtracking type.",
          };
      }

      trackingResults.push({
        trackingID,
        result: trackingResult,
      });
    }

    res.json({
      trackingResults,
    });
  } catch (error) {
    console.error("Error occurred while tracking:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});