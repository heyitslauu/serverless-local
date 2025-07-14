import { APIGatewayProxyHandler } from "aws-lambda";

import { allotmentService } from "../../services/allotmentService";

const { createAllotment } = allotmentService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const result = await createAllotment(body);

    if ("statusCode" in result && result.statusCode === 422) {
      return {
        statusCode: 422,
        body: JSON.stringify({ errors: result.errors }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Created Allotments successfully",
        data: result,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error creating Allotment",
        error: error.message,
      }),
    };
  }
};
