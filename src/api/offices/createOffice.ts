import { APIGatewayProxyHandler } from "aws-lambda";

import { officeService } from "../../services/officeService";

const { createOffice } = officeService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      throw new Error("Missing request body.");
    }

    const body = JSON.parse(event.body);
    const newOffice = await createOffice(body);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Office created",
        office: newOffice,
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
