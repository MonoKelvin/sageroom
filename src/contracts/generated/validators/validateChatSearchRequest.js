import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateChatSearchRequest.js
var validateChatSearchRequest = validate190;
var schema251 = {
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"additionalProperties": false,
	"properties": {
		"created_after": {
			"default": null,
			"format": "int64",
			"maximum": 9007199254740991,
			"minimum": -9007199254740991,
			"type": ["integer", "null"]
		},
		"created_before": {
			"default": null,
			"format": "int64",
			"maximum": 9007199254740991,
			"minimum": -9007199254740991,
			"type": ["integer", "null"]
		},
		"cursor": {
			"default": null,
			"type": ["string", "null"]
		},
		"data_generation_id": { "type": "string" },
		"limit": {
			"format": "uint32",
			"maximum": 200,
			"minimum": 1,
			"type": "integer"
		},
		"query": {
			"maxLength": 256,
			"minLength": 1,
			"type": "string"
		},
		"search_id": { "type": "string" },
		"sender_id": {
			"default": null,
			"type": ["string", "null"]
		}
	},
	"required": [
		"data_generation_id",
		"search_id",
		"query",
		"limit"
	],
	"title": "ChatSearchRequest",
	"type": "object"
};
var func2 = require_ucs2length().default;
function validate190(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate190.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.search_id === void 0 && (missing0 = "search_id") || data.query === void 0 && (missing0 = "query") || data.limit === void 0 && (missing0 = "limit")) {
			validate190.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "created_after" || key0 === "created_before" || key0 === "cursor" || key0 === "data_generation_id" || key0 === "limit" || key0 === "query" || key0 === "search_id" || key0 === "sender_id")) {
				validate190.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.created_after !== void 0) {
				let data0 = data.created_after;
				if (!(typeof data0 == "number" && !(data0 % 1) && !isNaN(data0) && isFinite(data0)) && data0 !== null) {
					validate190.errors = [{
						instancePath: instancePath + "/created_after",
						schemaPath: "#/properties/created_after/type",
						keyword: "type",
						params: { type: schema251.properties.created_after.type },
						message: "must be integer,null"
					}];
					return false;
				}
				if (typeof data0 == "number" && isFinite(data0)) {
					if (data0 > 9007199254740991 || isNaN(data0)) {
						validate190.errors = [{
							instancePath: instancePath + "/created_after",
							schemaPath: "#/properties/created_after/maximum",
							keyword: "maximum",
							params: {
								comparison: "<=",
								limit: 9007199254740991
							},
							message: "must be <= 9007199254740991"
						}];
						return false;
					} else if (data0 < -9007199254740991 || isNaN(data0)) {
						validate190.errors = [{
							instancePath: instancePath + "/created_after",
							schemaPath: "#/properties/created_after/minimum",
							keyword: "minimum",
							params: {
								comparison: ">=",
								limit: -9007199254740991
							},
							message: "must be >= -9007199254740991"
						}];
						return false;
					}
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.created_before !== void 0) {
					let data1 = data.created_before;
					if (!(typeof data1 == "number" && !(data1 % 1) && !isNaN(data1) && isFinite(data1)) && data1 !== null) {
						validate190.errors = [{
							instancePath: instancePath + "/created_before",
							schemaPath: "#/properties/created_before/type",
							keyword: "type",
							params: { type: schema251.properties.created_before.type },
							message: "must be integer,null"
						}];
						return false;
					}
					if (typeof data1 == "number" && isFinite(data1)) {
						if (data1 > 9007199254740991 || isNaN(data1)) {
							validate190.errors = [{
								instancePath: instancePath + "/created_before",
								schemaPath: "#/properties/created_before/maximum",
								keyword: "maximum",
								params: {
									comparison: "<=",
									limit: 9007199254740991
								},
								message: "must be <= 9007199254740991"
							}];
							return false;
						} else if (data1 < -9007199254740991 || isNaN(data1)) {
							validate190.errors = [{
								instancePath: instancePath + "/created_before",
								schemaPath: "#/properties/created_before/minimum",
								keyword: "minimum",
								params: {
									comparison: ">=",
									limit: -9007199254740991
								},
								message: "must be >= -9007199254740991"
							}];
							return false;
						}
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.cursor !== void 0) {
						let data2 = data.cursor;
						if (typeof data2 !== "string" && data2 !== null) {
							validate190.errors = [{
								instancePath: instancePath + "/cursor",
								schemaPath: "#/properties/cursor/type",
								keyword: "type",
								params: { type: schema251.properties.cursor.type },
								message: "must be string,null"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.data_generation_id !== void 0) {
							if (typeof data.data_generation_id !== "string") {
								validate190.errors = [{
									instancePath: instancePath + "/data_generation_id",
									schemaPath: "#/properties/data_generation_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.limit !== void 0) {
								let data4 = data.limit;
								if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4))) {
									validate190.errors = [{
										instancePath: instancePath + "/limit",
										schemaPath: "#/properties/limit/type",
										keyword: "type",
										params: { type: "integer" },
										message: "must be integer"
									}];
									return false;
								}
								if (typeof data4 == "number" && isFinite(data4)) {
									if (data4 > 200 || isNaN(data4)) {
										validate190.errors = [{
											instancePath: instancePath + "/limit",
											schemaPath: "#/properties/limit/maximum",
											keyword: "maximum",
											params: {
												comparison: "<=",
												limit: 200
											},
											message: "must be <= 200"
										}];
										return false;
									} else if (data4 < 1 || isNaN(data4)) {
										validate190.errors = [{
											instancePath: instancePath + "/limit",
											schemaPath: "#/properties/limit/minimum",
											keyword: "minimum",
											params: {
												comparison: ">=",
												limit: 1
											},
											message: "must be >= 1"
										}];
										return false;
									}
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.query !== void 0) {
									let data5 = data.query;
									if (typeof data5 === "string") {
										if (func2(data5) > 256) {
											validate190.errors = [{
												instancePath: instancePath + "/query",
												schemaPath: "#/properties/query/maxLength",
												keyword: "maxLength",
												params: { limit: 256 },
												message: "must NOT have more than 256 characters"
											}];
											return false;
										} else if (func2(data5) < 1) {
											validate190.errors = [{
												instancePath: instancePath + "/query",
												schemaPath: "#/properties/query/minLength",
												keyword: "minLength",
												params: { limit: 1 },
												message: "must NOT have fewer than 1 characters"
											}];
											return false;
										}
									} else {
										validate190.errors = [{
											instancePath: instancePath + "/query",
											schemaPath: "#/properties/query/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
								if (valid0) {
									if (data.search_id !== void 0) {
										if (typeof data.search_id !== "string") {
											validate190.errors = [{
												instancePath: instancePath + "/search_id",
												schemaPath: "#/properties/search_id/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										var valid0 = true;
									} else var valid0 = true;
									if (valid0) {
										if (data.sender_id !== void 0) {
											let data7 = data.sender_id;
											if (typeof data7 !== "string" && data7 !== null) {
												validate190.errors = [{
													instancePath: instancePath + "/sender_id",
													schemaPath: "#/properties/sender_id/type",
													keyword: "type",
													params: { type: schema251.properties.sender_id.type },
													message: "must be string,null"
												}];
												return false;
											}
											var valid0 = true;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		}
	} else {
		validate190.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate190.errors = vErrors;
	return true;
}
validate190.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateChatSearchRequest };
