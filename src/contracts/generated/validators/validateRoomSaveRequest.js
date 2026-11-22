import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateRoomSaveRequest.js
var validateRoomSaveRequest = validate288;
var func2 = require_ucs2length().default;
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate288(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate288.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.expected_version === void 0 && (missing0 = "expected_version") || data.name === void 0 && (missing0 = "name")) {
			validate288.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "client_request_id" || key0 === "data_generation_id" || key0 === "expected_version" || key0 === "name")) {
				validate288.errors = [{
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
					validate288.errors = [{
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
						validate288.errors = [{
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
					if (data.expected_version !== void 0) {
						let data2 = data.expected_version;
						if (typeof data2 === "string") {
							if (func2(data2) > 19) {
								validate288.errors = [{
									instancePath: instancePath + "/expected_version",
									schemaPath: "#/$defs/DecimalString/maxLength",
									keyword: "maxLength",
									params: { limit: 19 },
									message: "must NOT have more than 19 characters"
								}];
								return false;
							} else if (!pattern4.test(data2)) {
								validate288.errors = [{
									instancePath: instancePath + "/expected_version",
									schemaPath: "#/$defs/DecimalString/pattern",
									keyword: "pattern",
									params: { pattern: "^(0|[1-9][0-9]*)$" },
									message: "must match pattern \"^(0|[1-9][0-9]*)$\""
								}];
								return false;
							}
						} else {
							validate288.errors = [{
								instancePath: instancePath + "/expected_version",
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
						if (data.name !== void 0) {
							if (typeof data.name !== "string") {
								validate288.errors = [{
									instancePath: instancePath + "/name",
									schemaPath: "#/properties/name/type",
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
	} else {
		validate288.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate288.errors = vErrors;
	return true;
}
validate288.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateRoomSaveRequest };
