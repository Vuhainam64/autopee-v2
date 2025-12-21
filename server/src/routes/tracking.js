const express = require("express");
const { handleAsync } = require("../middleware/error");
const {
  SPXTracking,
  JNTTracking,
  GHNTracking,
  NJVTracking,
  autoTrack,
} = require("../services/trackingService");

const router = express.Router();

// POST /tracking - Track single order
router.post(
  "/tracking",
  handleAsync(async (req, res) => {
    const { webtracking, trackingID, cellphone } = req.body;

    if (!trackingID) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Missing 'trackingID' field in the request body.",
        },
      });
    }

    let trackingResult;
    try {
      if (webtracking) {
        const carrier = webtracking.toUpperCase();
        switch (carrier) {
          case "SPX":
            trackingResult = await SPXTracking(trackingID);
            break;
          case "JNT":
            if (!cellphone) {
              return res.status(400).json({
                success: false,
                error: {
                  message: "Missing 'cellphone' field for JNT tracking.",
                },
              });
            }
            trackingResult = await JNTTracking(trackingID, cellphone);
            break;
          case "GHN":
            trackingResult = await GHNTracking(trackingID);
            break;
          case "NJV":
            trackingResult = await NJVTracking(trackingID);
            break;
          default:
            return res.status(400).json({
              success: false,
              error: {
                message: `Unsupported carrier: ${carrier}. Supported carriers: SPX, JNT, GHN, NJV`,
              },
            });
        }
      } else {
        // Auto-detect carrier
        trackingResult = await autoTrack(trackingID, cellphone);
      }

      res.json({
        success: true,
        data: {
          trackingID,
          carrier: webtracking || "AUTO",
          ...trackingResult,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: error.message || "Error occurred while tracking",
        },
      });
    }
  })
);

// POST /tracking/list - Track multiple orders
router.post(
  "/tracking/list",
  handleAsync(async (req, res) => {
    const { trackingList } = req.body;

    if (!trackingList || !Array.isArray(trackingList)) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "Invalid tracking list. It should be an array of tracking objects.",
        },
      });
    }

    const trackingResults = [];

    for (const item of trackingList) {
      const { trackingID, cellphone, webtracking } = item;

      if (!trackingID) {
        trackingResults.push({
          trackingID: item.trackingID || "N/A",
          success: false,
          error: "Missing 'trackingID' field in the tracking object.",
        });
        continue;
      }

      try {
        let trackingResult;
        if (webtracking) {
          const carrier = webtracking.toUpperCase();
          switch (carrier) {
            case "SPX":
              trackingResult = await SPXTracking(trackingID);
              break;
            case "JNT":
              if (!cellphone) {
                trackingResults.push({
                  trackingID,
                  success: false,
                  error: "Missing 'cellphone' field for JNT tracking.",
                });
                continue;
              }
              trackingResult = await JNTTracking(trackingID, cellphone);
              break;
            case "GHN":
              trackingResult = await GHNTracking(trackingID);
              break;
            case "NJV":
              trackingResult = await NJVTracking(trackingID);
              break;
            default:
              trackingResults.push({
                trackingID,
                success: false,
                error: `Unsupported carrier: ${carrier}`,
              });
              continue;
          }
        } else {
          trackingResult = await autoTrack(trackingID, cellphone);
        }

        trackingResults.push({
          trackingID,
          success: true,
          carrier: webtracking || "AUTO",
          ...trackingResult,
        });
      } catch (error) {
        trackingResults.push({
          trackingID,
          success: false,
          error: error.message || "Error tracking order",
        });
      }
    }

    res.json({
      success: true,
      data: {
        results: trackingResults,
        total: trackingList.length,
        successCount: trackingResults.filter((r) => r.success).length,
      },
    });
  })
);

module.exports = router;

