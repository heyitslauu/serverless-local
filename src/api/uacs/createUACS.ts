import { APIGatewayProxyHandler } from "aws-lambda";

import { uacsService } from "../../services/uacsService";

const { createUACS } = uacsService();

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

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing request body.",
        }),
      };
    }

    const body = JSON.parse(event.body);
    const newUACS = await createUACS(papId, body);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "UACS created successfully.",
        uacs: newUACS,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error creating UACS.",
        error: error.message,
      }),
    };
  }
};
