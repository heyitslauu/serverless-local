import { APIGatewayProxyHandler } from "aws-lambda";

import { papService } from "../../services/papService";

const { createPap } = papService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      throw new Error("Missing request body.");
    }

    const body = JSON.parse(event.body);
    const newPAP = await createPap(body);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "PAP created",
        allotment: newPAP,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error creating post",
        error: error.message,
      }),
    };
  }
};
