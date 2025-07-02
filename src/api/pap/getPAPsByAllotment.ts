import { APIGatewayProxyHandler } from "aws-lambda";

import { papService } from "../../services/papService";

const { getPAPsByAllotment } = papService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const allotmentId = event.pathParameters?.allotmentId;

    if (!allotmentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing allotmentId in path parameters.",
        }),
      };
    }
    const result = await getPAPsByAllotment(allotmentId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "PAPs retrieved",
        result,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to retrieve PAPs of the allotment",
        error: error.message,
      }),
    };
  }
};
