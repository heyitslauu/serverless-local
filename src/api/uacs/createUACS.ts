import { APIGatewayProxyHandler } from "aws-lambda";

import { uacsService } from "../../services/uacsService";

const { createUACS } = uacsService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing request body.",
        }),
      };
    }

    const body = JSON.parse(event.body);
    const result = await createUACS(body);

    if ("statusCode" in result && result.statusCode === 422) {
      return {
        statusCode: 422,
        body: JSON.stringify({ errors: result.message }),
      };
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "UACS created successfully.",
        uacs: result,
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
