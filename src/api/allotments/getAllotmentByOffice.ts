import { APIGatewayProxyHandler } from "aws-lambda";

import { allotmentService } from "../../services/allotmentService";

const { getAllotmentByOffice } = allotmentService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const officeId = event.pathParameters?.officeId;
    if (!officeId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Missing officeId in path parameters.",
        }),
      };
    }
    const result = await getAllotmentByOffice(officeId);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Successfully retrieved all allotments",
        data: result.items,
        totalAlloted: result.totalAlloted,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Failed to retrieve allotments.",
        error: error.message,
      }),
    };
  }
};
