import { APIGatewayProxyHandler } from "aws-lambda";

import { papService } from "../../services/papService";

const { createPAP } = papService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      throw new Error("Missing request body.");
    }
    const body = JSON.parse(event.body);
    const result = await createPAP(body);

    if ("statusCode" in result && result.statusCode === 422) {
      return {
        statusCode: 422,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Validation Error",
          message: result.message,
        }),
      };
    }
    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "PAP created",
        data: result,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Error creating PAP",
        error: error.message,
      }),
    };
  }
};
