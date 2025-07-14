import { APIGatewayProxyHandler } from "aws-lambda";

import { papService } from "../../services/papService";

const { getPAPs } = papService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const paps = await getPAPs();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully retrieved all PAPs.",
        data: paps,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving PAPs",
        error: error.message,
      }),
    };
  }
};
