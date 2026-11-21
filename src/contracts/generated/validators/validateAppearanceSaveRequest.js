import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateAppearanceSaveRequest.js
var validateAppearanceSaveRequest = validate103;
var schema139 = {
	"enum": [
		"system",
		"light",
		"dark"
	],
	"type": "string"
};
var func2 = require_ucs2length().default;
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate103(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate103.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.expected_revision === void 0 && (missing0 = "expected_revision") || data.theme === void 0 && (missing0 = "theme") || data.reduce_motion === void 0 && (missing0 = "reduce_motion")) {
			validate103.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "client_request_id" || key0 === "data_generation_id" || key0 === "expected_revision" || key0 === "reduce_motion" || key0 === "theme")) {
				validate103.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.client_request_id !== void 0) {
				if (typeof data.client_request_id !== "string") {
					validate103.errors = [{
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
						validate103.errors = [{
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
					if (data.expected_revision !== void 0) {
						let data2 = data.expected_revision;
						if (typeof data2 === "string") {
							if (func2(data2) > 19) {
								validate103.errors = [{
									instancePath: instancePath + "/expected_revision",
									schemaPath: "#/$defs/DecimalString/maxLength",
									keyword: "maxLength",
									params: { limit: 19 },
									message: "must NOT have more than 19 characters"
								}];
								return false;
							} else if (!pattern4.test(data2)) {
								validate103.errors = [{
									instancePath: instancePath + "/expected_revision",
									schemaPath: "#/$defs/DecimalString/pattern",
									keyword: "pattern",
									params: { pattern: "^(0|[1-9][0-9]*)$" },
									message: "must match pattern \"^(0|[1-9][0-9]*)$\""
								}];
								return false;
							}
						} else {
							validate103.errors = [{
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
					if (valid0) {
						if (data.reduce_motion !== void 0) {
							if (typeof data.reduce_motion !== "boolean") {
								validate103.errors = [{
									instancePath: instancePath + "/reduce_motion",
									schemaPath: "#/properties/reduce_motion/type",
									keyword: "type",
									params: { type: "boolean" },
									message: "must be boolean"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.theme !== void 0) {
								let data4 = data.theme;
								if (typeof data4 !== "string") {
									validate103.errors = [{
										instancePath: instancePath + "/theme",
										schemaPath: "#/$defs/Theme/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "system" || data4 === "light" || data4 === "dark")) {
									validate103.errors = [{
										instancePath: instancePath + "/theme",
										schemaPath: "#/$defs/Theme/enum",
										keyword: "enum",
										params: { allowedValues: schema139.enum },
										message: "must be equal to one of the allowed values"
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
	} else {
		validate103.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate103.errors = vErrors;
	return true;
}
validate103.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateAppearanceSaveRequest };
