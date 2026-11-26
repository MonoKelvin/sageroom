import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateUserProfileSaveRequest.js
var validateUserProfileSaveRequest = validate552;
var schema708 = {
	"$defs": { "DecimalString": {
		"maxLength": 19,
		"pattern": "^(0|[1-9][0-9]*)$",
		"type": "string"
	} },
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"additionalProperties": false,
	"properties": {
		"avatar_id": { "type": ["string", "null"] },
		"bio": {
			"default": "",
			"maxLength": 200,
			"type": "string"
		},
		"client_request_id": { "type": "string" },
		"data_generation_id": { "type": "string" },
		"display_name": {
			"maxLength": 16,
			"type": "string"
		},
		"expected_revision": { "$ref": "#/$defs/DecimalString" }
	},
	"required": [
		"data_generation_id",
		"client_request_id",
		"expected_revision",
		"display_name"
	],
	"title": "UserProfileSaveRequest",
	"type": "object"
};
var func2 = require_ucs2length().default;
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate552(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate552.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.expected_revision === void 0 && (missing0 = "expected_revision") || data.display_name === void 0 && (missing0 = "display_name")) {
			validate552.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "avatar_id" || key0 === "bio" || key0 === "client_request_id" || key0 === "data_generation_id" || key0 === "display_name" || key0 === "expected_revision")) {
				validate552.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.avatar_id !== void 0) {
				let data0 = data.avatar_id;
				if (typeof data0 !== "string" && data0 !== null) {
					validate552.errors = [{
						instancePath: instancePath + "/avatar_id",
						schemaPath: "#/properties/avatar_id/type",
						keyword: "type",
						params: { type: schema708.properties.avatar_id.type },
						message: "must be string,null"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.bio !== void 0) {
					let data1 = data.bio;
					if (typeof data1 === "string") {
						if (func2(data1) > 200) {
							validate552.errors = [{
								instancePath: instancePath + "/bio",
								schemaPath: "#/properties/bio/maxLength",
								keyword: "maxLength",
								params: { limit: 200 },
								message: "must NOT have more than 200 characters"
							}];
							return false;
						}
					} else {
						validate552.errors = [{
							instancePath: instancePath + "/bio",
							schemaPath: "#/properties/bio/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.client_request_id !== void 0) {
						if (typeof data.client_request_id !== "string") {
							validate552.errors = [{
								instancePath: instancePath + "/client_request_id",
								schemaPath: "#/properties/client_request_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.data_generation_id !== void 0) {
							if (typeof data.data_generation_id !== "string") {
								validate552.errors = [{
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
							if (data.display_name !== void 0) {
								let data4 = data.display_name;
								if (typeof data4 === "string") {
									if (func2(data4) > 16) {
										validate552.errors = [{
											instancePath: instancePath + "/display_name",
											schemaPath: "#/properties/display_name/maxLength",
											keyword: "maxLength",
											params: { limit: 16 },
											message: "must NOT have more than 16 characters"
										}];
										return false;
									}
								} else {
									validate552.errors = [{
										instancePath: instancePath + "/display_name",
										schemaPath: "#/properties/display_name/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.expected_revision !== void 0) {
									let data5 = data.expected_revision;
									if (typeof data5 === "string") {
										if (func2(data5) > 19) {
											validate552.errors = [{
												instancePath: instancePath + "/expected_revision",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											}];
											return false;
										} else if (!pattern4.test(data5)) {
											validate552.errors = [{
												instancePath: instancePath + "/expected_revision",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											}];
											return false;
										}
									} else {
										validate552.errors = [{
											instancePath: instancePath + "/expected_revision",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
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
	} else {
		validate552.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate552.errors = vErrors;
	return true;
}
validate552.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateUserProfileSaveRequest };
