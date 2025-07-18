import { APIGatewayProxyHandler } from "aws-lambda";

import { allotmentService } from "../../services/allotmentService";

const { updateAllotmentStatus } = allotmentService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const allotmentId = event.pathParameters?.allotmentId;
    if (!allotmentId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "Allotment ID is required" }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { status, remarks } = body;

    if (
      !status ||
      ![
        "for-triage",
        "for-processing",
        "for-peer-review",
        "for-approval",
        "approved",
        "rejected",
      ].includes(status)
    ) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "Invalid or missing status" }),
      };
    }

    await updateAllotmentStatus(allotmentId, { status, remarks });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Allotment status updated successfully",
      }),
    };
  } catch (error) {
    console.error("Error updating allotment status:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
