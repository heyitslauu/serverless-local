import { APIGatewayProxyHandler } from "aws-lambda";

import { papService } from "../../services/papService";

const { getPAPByID } = papService();

export const handler: APIGatewayProxyHandler = async (event) => {
  const papId = event.pathParameters?.papId;
  if (!papId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing papId in path parameters" }),
    };
  }

  try {
    const pap = await getPAPByID(papId);
    if (!pap) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "PAP not found" }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(pap),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
