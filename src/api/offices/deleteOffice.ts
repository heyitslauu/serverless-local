import { APIGatewayProxyHandler } from "aws-lambda";

import { officeService } from "../../services/officeService";

const { deleteOffice } = officeService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const officeId = event.pathParameters?.officeId;

    if (!officeId) {
      throw new Error("officeId is required in pathParameters.");
    }

    await deleteOffice(officeId);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Successfully deleted an Office.",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Error deleting an Office.",
        error: error.message,
      }),
    };
  }
};
