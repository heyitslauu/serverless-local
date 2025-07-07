import { APIGatewayProxyHandler } from "aws-lambda";

import { allotmentService } from "../../services/allotmentService";

const { getAllotmentById } = allotmentService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const allotmentId = event.pathParameters?.allotmentId;

    if (!allotmentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing Allotment ID in path parameters.",
        }),
      };
    }

    const allotment = await getAllotmentById(allotmentId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully retrieved all allotments.",
        data: allotment.items,
        totalAlloted: allotment.totalAlloted,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to retrieve allotments.",
        error: error.message,
      }),
    };
  }
};
