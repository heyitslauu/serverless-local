import { APIGatewayProxyHandler } from "aws-lambda";
import { exflowService } from "../../services/exflowService";

const { addOfficial } = exflowService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { allotmentId } = event.pathParameters || {};

    const body = event.body ? JSON.parse(event.body) : null;

    if (!allotmentId || !body || !body.exflow) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Invalid request. Missing allotmentId or exflow in body.",
        }),
      };
    }

    const result = await addOfficial({
      allotmentId,
      exflow: body.exflow,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Assigned an official successfully",
        data: result,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Failed to assign an official",
        error: error.message,
      }),
    };
  }
};
