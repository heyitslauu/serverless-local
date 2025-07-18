import { APIGatewayProxyHandler } from "aws-lambda";

import { allotmentService } from "../../services/allotmentService";

const { patchBreakdown } = allotmentService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      throw new Error("Missing request body.");
    }

    const body = JSON.parse(event.body);

    const { officeId, allotmentId, breakdown } = body;
    if (
      !officeId ||
      !allotmentId ||
      !Array.isArray(breakdown) ||
      breakdown.length === 0
    ) {
      return {
        statusCode: 422,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message:
            "Invalid payload. 'officeId', 'allotmentId' and non-empty 'breakdown' are required.",
        }),
      };
    }
    const patchedAllotment = await patchBreakdown(body);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Breakdown added to existing allotment",
        ...patchedAllotment,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Error creating Allotment",
        error: error.message,
      }),
    };
  }
};
