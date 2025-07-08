import { APIGatewayProxyHandler } from "aws-lambda";

import { officeService } from "../../services/officeService";

const { getOfficeById } = officeService();

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
    const result = await getOfficeById(officeId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully retrieved office",
        result,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to retrieve office.",
        error: error.message,
      }),
    };
  }
};
