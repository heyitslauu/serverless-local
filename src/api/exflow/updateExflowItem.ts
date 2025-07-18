import { APIGatewayProxyHandler } from "aws-lambda";
import { exflowService } from "../../services/exflowService";

const { updateExflowItem } = exflowService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { allotmentId, exflowId, status, remarks } = JSON.parse(
      event.body || "{}"
    );

    if (!allotmentId || !exflowId || !status) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }

    const result = await updateExflowItem({
      allotmentId,
      exflowId,
      status,
      remarks,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Exflow item updated successfully",
        data: result,
      }),
    };
  } catch (error) {
    console.error("Error updating exflow item:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
