const axios = require('axios');
const crypto = require('crypto');
const cheerio = require('cheerio');

/**
 * Encode key for SPX tracking
 */
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

/**
 * Track SPX order
 */
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

    return {
      time: timeString,
      date: dateString,
      message: firstTrackingItem.message,
    };
  } catch (error) {
    throw new Error(error.message || "Error tracking SPX order");
  }
}

/**
 * Track JNT order
 */
async function JNTTracking(trackingID, cellphone) {
  try {
    if (!trackingID || !cellphone) {
      throw new Error("Missing parameters: 'trackingID' or 'cellphone'.");
    }

    const response = await axios.get(
      `https://jtexpress.vn/vi/tracking?type=track&billcode=${trackingID}&cellphone=${cellphone}`
    );
    const html = response.data;
    const $ = cheerio.load(html);

    const tabContent = $(".tab-content");
    const result = [];

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

    if (result.length === 0) {
      throw new Error("No tracking information found");
    }

    return result[0];
  } catch (error) {
    throw new Error(error.message || "Error tracking JNT order");
  }
}

/**
 * Track GHN order
 */
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

    if (!response.data.data || !response.data.data.tracking_logs || response.data.data.tracking_logs.length === 0) {
      throw new Error("No tracking information found");
    }

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
    throw new Error(error.message || "Error tracking GHN order");
  }
}

/**
 * Track Ninja Van order
 */
async function NJVTracking(tracking_id) {
  try {
    if (!tracking_id) {
      throw new Error("Missing 'tracking_id'.");
    }
    const response = await axios.get(
      `https://walrus.ninjavan.co/vn/dash/1.2/public/orders?tracking_id=${tracking_id}`
    );

    if (!response.data.events || response.data.events.length === 0) {
      throw new Error("No tracking events available for the provided tracking ID.");
    }

    const eventData = response.data.events[0];

    const time = eventData.time.split("T")[1].slice(0, -1);
    const message = `${eventData.type} ${eventData.data.hub_name}`;
    const date = eventData.time.split("T")[0];

    return {
      time,
      message,
      date,
    };
  } catch (error) {
    throw new Error(error.message || "Error tracking Ninja Van order");
  }
}

/**
 * Auto-detect carrier and track
 */
async function autoTrack(trackingID, cellphone = null) {
  try {
    // SPX: starts with SPX or VN
    if (trackingID.startsWith("SPX") || trackingID.startsWith("VN")) {
      return await SPXTracking(trackingID);
    }
    
    // JNT: requires cellphone
    if (cellphone && cellphone.length > 1) {
      return await JNTTracking(trackingID, cellphone);
    }
    
    // GHN: starts with G
    if (trackingID.startsWith("G")) {
      return await GHNTracking(trackingID);
    }
    
    // Ninja Van: starts with NJV or SPE
    if (trackingID.startsWith("NJV") || trackingID.startsWith("SPE")) {
      return await NJVTracking(trackingID);
    }
    
    throw new Error("Unsupported tracking type. Please specify carrier manually.");
  } catch (error) {
    throw error;
  }
}

module.exports = {
  SPXTracking,
  JNTTracking,
  GHNTracking,
  NJVTracking,
  autoTrack,
};

