import { APIGatewayProxyHandler } from "aws-lambda";
import { allotmentService } from "../../services/allotmentService";
const { postAllotmentBreakdown } = allotmentService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { allotmentId, objectExpenditures } = body;

    if (!allotmentId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Missing allotmentId in request body",
        }),
      };
    }

    if (!Array.isArray(objectExpenditures) || objectExpenditures.length === 0) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "objectExpenditures must be a non-empty array",
        }),
      };
    }

    // Refactored to use a single object parameter
    const result = await postAllotmentBreakdown({
      allotmentId,
      objectExpenditures,
    });

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Internal server error",
        error: (error as Error).message,
      }),
    };
  }
};
