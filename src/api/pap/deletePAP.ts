import { APIGatewayProxyHandler } from "aws-lambda";

import { papService } from "../../services/papService";

const { deletePAP } = papService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const papId = event.pathParameters?.papId;

    if (!papId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "Missing PAP id in path parameters" }),
      };
    }

    await deletePAP(papId);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "PAP deleted successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Failed to delete PAP",
        error: (error as Error).message,
      }),
    };
  }
};
