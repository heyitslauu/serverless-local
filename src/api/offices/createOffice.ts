import { APIGatewayProxyHandler } from "aws-lambda";

import { officeService } from "../../services/officeService";

const { createOffice } = officeService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      throw new Error("Missing request body.");
    }

    const body = JSON.parse(event.body);
    const result = await createOffice(body);

    if ("statusCode" in result && result.statusCode === 422) {
      return {
        statusCode: 422,
        body: JSON.stringify({
          error: "Validation Error",
          message: result.message,
        }),
      };
    }
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Office created",
        data: result,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error creating Office",
        error: error.message,
      }),
    };
  }
};
