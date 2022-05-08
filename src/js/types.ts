export interface IMessageRequest {
  type: string;
  payload: Record<string, any>;
}

export interface ISlide {
  querySelector: string;
  displayName: string;
}
