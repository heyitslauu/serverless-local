import { APIGatewayProxyHandler } from "aws-lambda";

import { allotmentService } from "../../services/allotmentService";

const { getAllotmentsByOffice } = allotmentService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const officeId = event.pathParameters?.officeId;
    if (!officeId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing officeId in path parameters.",
        }),
      };
    }

    const result = await getAllotmentsByOffice(officeId);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Allotments retrieved", result }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to retrieve Allotments",
        error: error.message,
      }),
    };
  }
};
