import { APIGatewayProxyHandler } from "aws-lambda";

import { allotmentService } from "../../services/allotmentService";

const { deleteAllotmentBreakdown } = allotmentService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "Request body is required" }),
      };
    }

    const { pk, sk } = JSON.parse(event.body);

    if (!pk || !sk) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "Both 'pk' and 'sk' are required" }),
      };
    }

    await deleteAllotmentBreakdown(pk, sk);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Allotment breakdown deleted successfully",
      }),
    };
  } catch (error) {
    console.error("Error deleting allotment breakdown:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
