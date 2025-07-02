import { APIGatewayProxyHandler } from "aws-lambda";

import { allotmentService } from "../../services/allotmentService";

const { createAllotment } = allotmentService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      throw new Error("Missing request body.");
    }

    const body = JSON.parse(event.body);
    const newAllotment = await createAllotment(body);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Allotment created",
        allotment: newAllotment,
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
