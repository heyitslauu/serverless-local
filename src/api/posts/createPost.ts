import { APIGatewayProxyHandler } from "aws-lambda";
import { createPost } from "../../services/postService";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      throw new Error("Missing request body.");
    }

    const body = JSON.parse(event.body);
    const newPost = await createPost(body);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Post created", post: newPost }),
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
