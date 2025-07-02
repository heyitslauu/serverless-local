import { APIGatewayProxyHandler } from "aws-lambda";

import { allotmentService } from "../../services/allotmentService";

const { getAllAllotments } = allotmentService();

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const allotments = await getAllAllotments();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully retrieved all allotments.",
        allotments,
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
