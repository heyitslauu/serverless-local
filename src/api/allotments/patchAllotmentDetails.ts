import { APIGatewayProxyHandler } from "aws-lambda";
import { allotmentService } from "../../services/allotmentService";

const { patchDetails } = allotmentService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const allotmentId = event.pathParameters?.allotmentId;
    if (!allotmentId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Missing allotmentId in path parameters",
        }),
      };
    }

    const body = JSON.parse(event.body || "{}");

    if (!body) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Invalid body. Missing required fields.",
        }),
      };
    }

    const result = await patchDetails(allotmentId, body);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Allotment details updated successfully",
        data: result,
      }),
    };
  } catch (error) {
    console.error("Error patching allotment details:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
