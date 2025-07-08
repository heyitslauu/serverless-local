import { APIGatewayProxyHandler } from "aws-lambda";

import { papService } from "../../services/papService";

const { getPAPByOffice } = papService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const officeId = event.pathParameters?.officeId;

    if (!officeId) {
      throw new Error("officeId is required in pathParameters.");
    }

    const result = await getPAPByOffice(officeId);

    if (!result) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "PAP not found." }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "PAP retrieved", result }),
    };
  } catch (error: any) {
    console.error("Error fetching PAP:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
    };
  }
};
