import { APIGatewayProxyHandler } from "aws-lambda";
import { allotmentService } from "../../services/allotmentService";

const { createAllotmentItem } = allotmentService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const result = await createAllotmentItem(body);
    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Allotment item created", data: result }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Failed to create allotment item",
        error: (error as Error).message,
      }),
    };
  }
};
