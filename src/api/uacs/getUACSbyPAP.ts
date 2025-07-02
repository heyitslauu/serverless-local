import { APIGatewayProxyHandler } from "aws-lambda";

import { uacsService } from "../../services/uacsService";

const { getAllUACSByPAP } = uacsService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const papId = event.pathParameters?.papId;

    if (!papId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing papId in path parameters.",
        }),
      };
    }
    const result = await getAllUACSByPAP(papId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "UACS retrieved",
        result,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to retrieve UACS of the PAP",
        error: error.message,
      }),
    };
  }
};
