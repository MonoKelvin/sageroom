import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateAppSnapshotResponse.js
var validateAppSnapshotResponse = validate76;
var schema128 = {
	"enum": ["0.3"],
	"type": "string"
};
var schema105 = {
	"additionalProperties": false,
	"properties": {
		"app_version": { "type": "string" },
		"appearance": { "$ref": "#/$defs/Appearance" },
		"data_directory": { "type": "string" },
		"data_generation_id": { "type": "string" },
		"data_usage": { "$ref": "#/$defs/DataUsage" },
		"development_tools_available": { "type": "boolean" },
		"events": {
			"items": { "$ref": "#/$defs/DomainEvent" },
			"type": "array"
		},
		"latest_event_seq": { "$ref": "#/$defs/DecimalString" },
		"latest_message_seq": { "$ref": "#/$defs/DecimalString" },
		"local_user": { "$ref": "#/$defs/Participant" },
		"participants": {
			"items": { "$ref": "#/$defs/Participant" },
			"type": "array"
		},
		"requires_full_reload": { "type": "boolean" },
		"room": { "$ref": "#/$defs/Room" }
	},
	"required": [
		"data_generation_id",
		"room",
		"local_user",
		"participants",
		"appearance",
		"latest_message_seq",
		"latest_event_seq",
		"events",
		"requires_full_reload",
		"data_directory",
		"data_usage",
		"app_version",
		"development_tools_available"
	],
	"type": "object"
};
var func1 = Object.prototype.hasOwnProperty;
var func2 = require_ucs2length().default;
var schema108 = {
	"enum": [
		"system",
		"light",
		"dark"
	],
	"type": "string"
};
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate79(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate79.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.theme === void 0 && (missing0 = "theme") || data.reduce_motion === void 0 && (missing0 = "reduce_motion") || data.revision === void 0 && (missing0 = "revision")) {
			validate79.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "reduce_motion" || key0 === "revision" || key0 === "theme")) {
				validate79.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.reduce_motion !== void 0) {
				if (typeof data.reduce_motion !== "boolean") {
					validate79.errors = [{
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
				if (data.revision !== void 0) {
					let data1 = data.revision;
					if (typeof data1 === "string") {
						if (func2(data1) > 19) {
							validate79.errors = [{
								instancePath: instancePath + "/revision",
								schemaPath: "#/$defs/DecimalString/maxLength",
								keyword: "maxLength",
								params: { limit: 19 },
								message: "must NOT have more than 19 characters"
							}];
							return false;
						} else if (!pattern4.test(data1)) {
							validate79.errors = [{
								instancePath: instancePath + "/revision",
								schemaPath: "#/$defs/DecimalString/pattern",
								keyword: "pattern",
								params: { pattern: "^(0|[1-9][0-9]*)$" },
								message: "must match pattern \"^(0|[1-9][0-9]*)$\""
							}];
							return false;
						}
					} else {
						validate79.errors = [{
							instancePath: instancePath + "/revision",
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
					if (data.theme !== void 0) {
						let data2 = data.theme;
						if (typeof data2 !== "string") {
							validate79.errors = [{
								instancePath: instancePath + "/theme",
								schemaPath: "#/$defs/Theme/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "system" || data2 === "light" || data2 === "dark")) {
							validate79.errors = [{
								instancePath: instancePath + "/theme",
								schemaPath: "#/$defs/Theme/enum",
								keyword: "enum",
								params: { allowedValues: schema108.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
				}
			}
		}
	} else {
		validate79.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate79.errors = vErrors;
	return true;
}
validate79.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate81(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate81.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.database_bytes === void 0 && (missing0 = "database_bytes") || data.avatar_bytes === void 0 && (missing0 = "avatar_bytes")) {
			validate81.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "avatar_bytes" || key0 === "database_bytes")) {
				validate81.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.avatar_bytes !== void 0) {
				let data0 = data.avatar_bytes;
				if (typeof data0 === "string") {
					if (func2(data0) > 19) {
						validate81.errors = [{
							instancePath: instancePath + "/avatar_bytes",
							schemaPath: "#/$defs/DecimalString/maxLength",
							keyword: "maxLength",
							params: { limit: 19 },
							message: "must NOT have more than 19 characters"
						}];
						return false;
					} else if (!pattern4.test(data0)) {
						validate81.errors = [{
							instancePath: instancePath + "/avatar_bytes",
							schemaPath: "#/$defs/DecimalString/pattern",
							keyword: "pattern",
							params: { pattern: "^(0|[1-9][0-9]*)$" },
							message: "must match pattern \"^(0|[1-9][0-9]*)$\""
						}];
						return false;
					}
				} else {
					validate81.errors = [{
						instancePath: instancePath + "/avatar_bytes",
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
				if (data.database_bytes !== void 0) {
					let data1 = data.database_bytes;
					if (typeof data1 === "string") {
						if (func2(data1) > 19) {
							validate81.errors = [{
								instancePath: instancePath + "/database_bytes",
								schemaPath: "#/$defs/DecimalString/maxLength",
								keyword: "maxLength",
								params: { limit: 19 },
								message: "must NOT have more than 19 characters"
							}];
							return false;
						} else if (!pattern4.test(data1)) {
							validate81.errors = [{
								instancePath: instancePath + "/database_bytes",
								schemaPath: "#/$defs/DecimalString/pattern",
								keyword: "pattern",
								params: { pattern: "^(0|[1-9][0-9]*)$" },
								message: "must match pattern \"^(0|[1-9][0-9]*)$\""
							}];
							return false;
						}
					} else {
						validate81.errors = [{
							instancePath: instancePath + "/database_bytes",
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
	} else {
		validate81.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate81.errors = vErrors;
	return true;
}
validate81.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate86(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate86.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.owner_participant_id === void 0 && (missing0 = "owner_participant_id") || data.version === void 0 && (missing0 = "version") || data.content_epoch === void 0 && (missing0 = "content_epoch")) {
			validate86.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "content_epoch" || key0 === "id" || key0 === "name" || key0 === "owner_participant_id" || key0 === "version")) {
				validate86.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.content_epoch !== void 0) {
				let data0 = data.content_epoch;
				if (typeof data0 === "string") {
					if (func2(data0) > 19) {
						validate86.errors = [{
							instancePath: instancePath + "/content_epoch",
							schemaPath: "#/$defs/DecimalString/maxLength",
							keyword: "maxLength",
							params: { limit: 19 },
							message: "must NOT have more than 19 characters"
						}];
						return false;
					} else if (!pattern4.test(data0)) {
						validate86.errors = [{
							instancePath: instancePath + "/content_epoch",
							schemaPath: "#/$defs/DecimalString/pattern",
							keyword: "pattern",
							params: { pattern: "^(0|[1-9][0-9]*)$" },
							message: "must match pattern \"^(0|[1-9][0-9]*)$\""
						}];
						return false;
					}
				} else {
					validate86.errors = [{
						instancePath: instancePath + "/content_epoch",
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
				if (data.id !== void 0) {
					if (typeof data.id !== "string") {
						validate86.errors = [{
							instancePath: instancePath + "/id",
							schemaPath: "#/properties/id/type",
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
							validate86.errors = [{
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
					if (valid0) {
						if (data.owner_participant_id !== void 0) {
							if (typeof data.owner_participant_id !== "string") {
								validate86.errors = [{
									instancePath: instancePath + "/owner_participant_id",
									schemaPath: "#/properties/owner_participant_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.version !== void 0) {
								let data4 = data.version;
								if (typeof data4 === "string") {
									if (func2(data4) > 19) {
										validate86.errors = [{
											instancePath: instancePath + "/version",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										}];
										return false;
									} else if (!pattern4.test(data4)) {
										validate86.errors = [{
											instancePath: instancePath + "/version",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										}];
										return false;
									}
								} else {
									validate86.errors = [{
										instancePath: instancePath + "/version",
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
	} else {
		validate86.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate86.errors = vErrors;
	return true;
}
validate86.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema119 = {
	"additionalProperties": false,
	"properties": {
		"avatar_id": {
			"default": null,
			"type": ["string", "null"]
		},
		"display_name": { "type": "string" },
		"id": { "type": "string" },
		"introduction": { "type": "string" },
		"is_builtin": { "type": "boolean" },
		"kind": { "$ref": "#/$defs/ParticipantKind" },
		"profile_revision": {
			"$ref": "#/$defs/DecimalString",
			"default": "1"
		},
		"runtime": { "anyOf": [{ "$ref": "#/$defs/AgentRuntimeState" }, { "type": "null" }] },
		"status": { "$ref": "#/$defs/ParticipantStatus" }
	},
	"required": [
		"id",
		"kind",
		"display_name",
		"introduction",
		"status",
		"is_builtin",
		"avatar_id",
		"profile_revision"
	],
	"type": "object"
};
var schema120 = {
	"enum": ["user", "agent"],
	"type": "string"
};
var schema125 = {
	"enum": ["present", "needs_configuration"],
	"type": "string"
};
var schema122 = {
	"additionalProperties": false,
	"properties": {
		"agent_id": { "type": "string" },
		"config_revision": { "$ref": "#/$defs/DecimalString" },
		"detail": { "type": ["string", "null"] },
		"next_wake_at": {
			"format": "int64",
			"type": ["integer", "null"]
		},
		"requests_today": {
			"format": "uint32",
			"minimum": 0,
			"type": "integer"
		},
		"status": { "$ref": "#/$defs/AgentRuntimeStatus" }
	},
	"required": [
		"agent_id",
		"config_revision",
		"status",
		"detail",
		"next_wake_at",
		"requests_today"
	],
	"type": "object"
};
var schema124 = {
	"enum": [
		"needs_configuration",
		"observing",
		"deciding",
		"waiting_to_send",
		"sleeping",
		"paused",
		"protected",
		"offline"
	],
	"type": "string"
};
function validate89(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate89.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.agent_id === void 0 && (missing0 = "agent_id") || data.config_revision === void 0 && (missing0 = "config_revision") || data.status === void 0 && (missing0 = "status") || data.detail === void 0 && (missing0 = "detail") || data.next_wake_at === void 0 && (missing0 = "next_wake_at") || data.requests_today === void 0 && (missing0 = "requests_today")) {
			validate89.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "agent_id" || key0 === "config_revision" || key0 === "detail" || key0 === "next_wake_at" || key0 === "requests_today" || key0 === "status")) {
				validate89.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.agent_id !== void 0) {
				if (typeof data.agent_id !== "string") {
					validate89.errors = [{
						instancePath: instancePath + "/agent_id",
						schemaPath: "#/properties/agent_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.config_revision !== void 0) {
					let data1 = data.config_revision;
					if (typeof data1 === "string") {
						if (func2(data1) > 19) {
							validate89.errors = [{
								instancePath: instancePath + "/config_revision",
								schemaPath: "#/$defs/DecimalString/maxLength",
								keyword: "maxLength",
								params: { limit: 19 },
								message: "must NOT have more than 19 characters"
							}];
							return false;
						} else if (!pattern4.test(data1)) {
							validate89.errors = [{
								instancePath: instancePath + "/config_revision",
								schemaPath: "#/$defs/DecimalString/pattern",
								keyword: "pattern",
								params: { pattern: "^(0|[1-9][0-9]*)$" },
								message: "must match pattern \"^(0|[1-9][0-9]*)$\""
							}];
							return false;
						}
					} else {
						validate89.errors = [{
							instancePath: instancePath + "/config_revision",
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
					if (data.detail !== void 0) {
						let data2 = data.detail;
						if (typeof data2 !== "string" && data2 !== null) {
							validate89.errors = [{
								instancePath: instancePath + "/detail",
								schemaPath: "#/properties/detail/type",
								keyword: "type",
								params: { type: schema122.properties.detail.type },
								message: "must be string,null"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.next_wake_at !== void 0) {
							let data3 = data.next_wake_at;
							if (!(typeof data3 == "number" && !(data3 % 1) && !isNaN(data3) && isFinite(data3)) && data3 !== null) {
								validate89.errors = [{
									instancePath: instancePath + "/next_wake_at",
									schemaPath: "#/properties/next_wake_at/type",
									keyword: "type",
									params: { type: schema122.properties.next_wake_at.type },
									message: "must be integer,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.requests_today !== void 0) {
								let data4 = data.requests_today;
								if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4))) {
									validate89.errors = [{
										instancePath: instancePath + "/requests_today",
										schemaPath: "#/properties/requests_today/type",
										keyword: "type",
										params: { type: "integer" },
										message: "must be integer"
									}];
									return false;
								}
								if (typeof data4 == "number" && isFinite(data4)) {
									if (data4 < 0 || isNaN(data4)) {
										validate89.errors = [{
											instancePath: instancePath + "/requests_today",
											schemaPath: "#/properties/requests_today/minimum",
											keyword: "minimum",
											params: {
												comparison: ">=",
												limit: 0
											},
											message: "must be >= 0"
										}];
										return false;
									}
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.status !== void 0) {
									let data5 = data.status;
									if (typeof data5 !== "string") {
										validate89.errors = [{
											instancePath: instancePath + "/status",
											schemaPath: "#/$defs/AgentRuntimeStatus/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									if (!(data5 === "needs_configuration" || data5 === "observing" || data5 === "deciding" || data5 === "waiting_to_send" || data5 === "sleeping" || data5 === "paused" || data5 === "protected" || data5 === "offline")) {
										validate89.errors = [{
											instancePath: instancePath + "/status",
											schemaPath: "#/$defs/AgentRuntimeStatus/enum",
											keyword: "enum",
											params: { allowedValues: schema124.enum },
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
		}
	} else {
		validate89.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate89.errors = vErrors;
	return true;
}
validate89.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate88(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate88.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.id === void 0 && (missing0 = "id") || data.kind === void 0 && (missing0 = "kind") || data.display_name === void 0 && (missing0 = "display_name") || data.introduction === void 0 && (missing0 = "introduction") || data.status === void 0 && (missing0 = "status") || data.is_builtin === void 0 && (missing0 = "is_builtin") || data.avatar_id === void 0 && (missing0 = "avatar_id") || data.profile_revision === void 0 && (missing0 = "profile_revision")) {
				validate88.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!func1.call(schema119.properties, key0)) {
					validate88.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.avatar_id !== void 0) {
						let data0 = data.avatar_id;
						const _errs2 = errors;
						if (typeof data0 !== "string" && data0 !== null) {
							validate88.errors = [{
								instancePath: instancePath + "/avatar_id",
								schemaPath: "#/properties/avatar_id/type",
								keyword: "type",
								params: { type: schema119.properties.avatar_id.type },
								message: "must be string,null"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.display_name !== void 0) {
							const _errs4 = errors;
							if (typeof data.display_name !== "string") {
								validate88.errors = [{
									instancePath: instancePath + "/display_name",
									schemaPath: "#/properties/display_name/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.id !== void 0) {
								const _errs6 = errors;
								if (typeof data.id !== "string") {
									validate88.errors = [{
										instancePath: instancePath + "/id",
										schemaPath: "#/properties/id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.introduction !== void 0) {
									const _errs8 = errors;
									if (typeof data.introduction !== "string") {
										validate88.errors = [{
											instancePath: instancePath + "/introduction",
											schemaPath: "#/properties/introduction/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = _errs8 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.is_builtin !== void 0) {
										const _errs10 = errors;
										if (typeof data.is_builtin !== "boolean") {
											validate88.errors = [{
												instancePath: instancePath + "/is_builtin",
												schemaPath: "#/properties/is_builtin/type",
												keyword: "type",
												params: { type: "boolean" },
												message: "must be boolean"
											}];
											return false;
										}
										var valid0 = _errs10 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.kind !== void 0) {
											let data5 = data.kind;
											const _errs12 = errors;
											if (typeof data5 !== "string") {
												validate88.errors = [{
													instancePath: instancePath + "/kind",
													schemaPath: "#/$defs/ParticipantKind/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
											if (!(data5 === "user" || data5 === "agent")) {
												validate88.errors = [{
													instancePath: instancePath + "/kind",
													schemaPath: "#/$defs/ParticipantKind/enum",
													keyword: "enum",
													params: { allowedValues: schema120.enum },
													message: "must be equal to one of the allowed values"
												}];
												return false;
											}
											var valid0 = _errs12 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.profile_revision !== void 0) {
												let data6 = data.profile_revision;
												const _errs15 = errors;
												if (errors === errors) {
													if (typeof data6 === "string") {
														if (func2(data6) > 19) {
															validate88.errors = [{
																instancePath: instancePath + "/profile_revision",
																schemaPath: "#/$defs/DecimalString/maxLength",
																keyword: "maxLength",
																params: { limit: 19 },
																message: "must NOT have more than 19 characters"
															}];
															return false;
														} else if (!pattern4.test(data6)) {
															validate88.errors = [{
																instancePath: instancePath + "/profile_revision",
																schemaPath: "#/$defs/DecimalString/pattern",
																keyword: "pattern",
																params: { pattern: "^(0|[1-9][0-9]*)$" },
																message: "must match pattern \"^(0|[1-9][0-9]*)$\""
															}];
															return false;
														}
													} else {
														validate88.errors = [{
															instancePath: instancePath + "/profile_revision",
															schemaPath: "#/$defs/DecimalString/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														}];
														return false;
													}
												}
												var valid0 = _errs15 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.runtime !== void 0) {
													let data7 = data.runtime;
													const _errs18 = errors;
													const _errs19 = errors;
													let valid3 = false;
													const _errs20 = errors;
													if (!validate89(data7, {
														instancePath: instancePath + "/runtime",
														parentData: data,
														parentDataProperty: "runtime",
														rootData,
														dynamicAnchors
													})) {
														vErrors = vErrors === null ? validate89.errors : vErrors.concat(validate89.errors);
														errors = vErrors.length;
													}
													var _valid0 = _errs20 === errors;
													valid3 = valid3 || _valid0;
													const _errs21 = errors;
													if (data7 !== null) {
														const err0 = {
															instancePath: instancePath + "/runtime",
															schemaPath: "#/properties/runtime/anyOf/1/type",
															keyword: "type",
															params: { type: "null" },
															message: "must be null"
														};
														if (vErrors === null) vErrors = [err0];
														else vErrors.push(err0);
														errors++;
													}
													var _valid0 = _errs21 === errors;
													valid3 = valid3 || _valid0;
													if (!valid3) {
														const err1 = {
															instancePath: instancePath + "/runtime",
															schemaPath: "#/properties/runtime/anyOf",
															keyword: "anyOf",
															params: {},
															message: "must match a schema in anyOf"
														};
														if (vErrors === null) vErrors = [err1];
														else vErrors.push(err1);
														errors++;
														validate88.errors = vErrors;
														return false;
													} else {
														errors = _errs19;
														if (vErrors !== null) {
															if (_errs19) vErrors.length = _errs19;
															else vErrors = null;
														}
													}
													var valid0 = _errs18 === errors;
												} else var valid0 = true;
												if (valid0) {
													if (data.status !== void 0) {
														let data8 = data.status;
														const _errs23 = errors;
														if (typeof data8 !== "string") {
															validate88.errors = [{
																instancePath: instancePath + "/status",
																schemaPath: "#/$defs/ParticipantStatus/type",
																keyword: "type",
																params: { type: "string" },
																message: "must be string"
															}];
															return false;
														}
														if (!(data8 === "present" || data8 === "needs_configuration")) {
															validate88.errors = [{
																instancePath: instancePath + "/status",
																schemaPath: "#/$defs/ParticipantStatus/enum",
																keyword: "enum",
																params: { allowedValues: schema125.enum },
																message: "must be equal to one of the allowed values"
															}];
															return false;
														}
														var valid0 = _errs23 === errors;
													} else var valid0 = true;
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate88.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate88.errors = vErrors;
	return errors === 0;
}
validate88.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate84(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate84.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	let passing0 = null;
	const _errs1 = errors;
	if (errors === _errs1) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.kind === void 0 && (missing0 = "kind") || data.message_id === void 0 && (missing0 = "message_id") || data.message_seq === void 0 && (missing0 = "message_seq") || data.sender_id === void 0 && (missing0 = "sender_id")) {
				const err0 = {
					instancePath,
					schemaPath: "#/oneOf/0/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				};
				if (vErrors === null) vErrors = [err0];
				else vErrors.push(err0);
				errors++;
			} else {
				const _errs3 = errors;
				for (const key0 in data) if (!(key0 === "kind" || key0 === "message_id" || key0 === "message_seq" || key0 === "sender_id")) {
					const err1 = {
						instancePath,
						schemaPath: "#/oneOf/0/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					};
					if (vErrors === null) vErrors = [err1];
					else vErrors.push(err1);
					errors++;
					break;
				}
				if (_errs3 === errors) {
					if (data.kind !== void 0) {
						let data0 = data.kind;
						const _errs4 = errors;
						if (typeof data0 !== "string") {
							const err2 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/0/properties/kind/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							};
							if (vErrors === null) vErrors = [err2];
							else vErrors.push(err2);
							errors++;
						}
						if ("message_committed" !== data0) {
							const err3 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/0/properties/kind/const",
								keyword: "const",
								params: { allowedValue: "message_committed" },
								message: "must be equal to constant"
							};
							if (vErrors === null) vErrors = [err3];
							else vErrors.push(err3);
							errors++;
						}
						var valid1 = _errs4 === errors;
					} else var valid1 = true;
					if (valid1) {
						if (data.message_id !== void 0) {
							const _errs6 = errors;
							if (typeof data.message_id !== "string") {
								const err4 = {
									instancePath: instancePath + "/message_id",
									schemaPath: "#/oneOf/0/properties/message_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err4];
								else vErrors.push(err4);
								errors++;
							}
							var valid1 = _errs6 === errors;
						} else var valid1 = true;
						if (valid1) {
							if (data.message_seq !== void 0) {
								let data2 = data.message_seq;
								const _errs8 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func2(data2) > 19) {
											const err5 = {
												instancePath: instancePath + "/message_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											};
											if (vErrors === null) vErrors = [err5];
											else vErrors.push(err5);
											errors++;
										} else if (!pattern4.test(data2)) {
											const err6 = {
												instancePath: instancePath + "/message_seq",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											};
											if (vErrors === null) vErrors = [err6];
											else vErrors.push(err6);
											errors++;
										}
									} else {
										const err7 = {
											instancePath: instancePath + "/message_seq",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err7];
										else vErrors.push(err7);
										errors++;
									}
								}
								var valid1 = _errs8 === errors;
							} else var valid1 = true;
							if (valid1) {
								if (data.sender_id !== void 0) {
									const _errs11 = errors;
									if (typeof data.sender_id !== "string") {
										const err8 = {
											instancePath: instancePath + "/sender_id",
											schemaPath: "#/oneOf/0/properties/sender_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err8];
										else vErrors.push(err8);
										errors++;
									}
									var valid1 = _errs11 === errors;
								} else var valid1 = true;
							}
						}
					}
				}
			}
		} else {
			const err9 = {
				instancePath,
				schemaPath: "#/oneOf/0/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			};
			if (vErrors === null) vErrors = [err9];
			else vErrors.push(err9);
			errors++;
		}
	}
	var _valid0 = _errs1 === errors;
	if (_valid0) {
		valid0 = true;
		passing0 = 0;
		var props0 = true;
	}
	const _errs13 = errors;
	if (errors === _errs13) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing1;
			if (data.kind === void 0 && (missing1 = "kind") || data.appearance === void 0 && (missing1 = "appearance")) {
				const err10 = {
					instancePath,
					schemaPath: "#/oneOf/1/required",
					keyword: "required",
					params: { missingProperty: missing1 },
					message: "must have required property '" + missing1 + "'"
				};
				if (vErrors === null) vErrors = [err10];
				else vErrors.push(err10);
				errors++;
			} else {
				const _errs15 = errors;
				for (const key1 in data) if (!(key1 === "appearance" || key1 === "kind")) {
					const err11 = {
						instancePath,
						schemaPath: "#/oneOf/1/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key1 },
						message: "must NOT have additional properties"
					};
					if (vErrors === null) vErrors = [err11];
					else vErrors.push(err11);
					errors++;
					break;
				}
				if (_errs15 === errors) {
					if (data.appearance !== void 0) {
						const _errs16 = errors;
						if (!validate79(data.appearance, {
							instancePath: instancePath + "/appearance",
							parentData: data,
							parentDataProperty: "appearance",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate79.errors : vErrors.concat(validate79.errors);
							errors = vErrors.length;
						}
						var valid3 = _errs16 === errors;
					} else var valid3 = true;
					if (valid3) {
						if (data.kind !== void 0) {
							let data5 = data.kind;
							const _errs17 = errors;
							if (typeof data5 !== "string") {
								const err12 = {
									instancePath: instancePath + "/kind",
									schemaPath: "#/oneOf/1/properties/kind/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err12];
								else vErrors.push(err12);
								errors++;
							}
							if ("appearance_changed" !== data5) {
								const err13 = {
									instancePath: instancePath + "/kind",
									schemaPath: "#/oneOf/1/properties/kind/const",
									keyword: "const",
									params: { allowedValue: "appearance_changed" },
									message: "must be equal to constant"
								};
								if (vErrors === null) vErrors = [err13];
								else vErrors.push(err13);
								errors++;
							}
							var valid3 = _errs17 === errors;
						} else var valid3 = true;
					}
				}
			}
		} else {
			const err14 = {
				instancePath,
				schemaPath: "#/oneOf/1/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			};
			if (vErrors === null) vErrors = [err14];
			else vErrors.push(err14);
			errors++;
		}
	}
	var _valid0 = _errs13 === errors;
	if (_valid0 && valid0) {
		valid0 = false;
		passing0 = [passing0, 1];
	} else {
		if (_valid0) {
			valid0 = true;
			passing0 = 1;
			if (props0 !== true) props0 = true;
		}
		const _errs19 = errors;
		if (errors === _errs19) {
			if (data && typeof data == "object" && !Array.isArray(data)) {
				let missing2;
				if (data.kind === void 0 && (missing2 = "kind") || data.room === void 0 && (missing2 = "room")) {
					const err15 = {
						instancePath,
						schemaPath: "#/oneOf/2/required",
						keyword: "required",
						params: { missingProperty: missing2 },
						message: "must have required property '" + missing2 + "'"
					};
					if (vErrors === null) vErrors = [err15];
					else vErrors.push(err15);
					errors++;
				} else {
					const _errs21 = errors;
					for (const key2 in data) if (!(key2 === "kind" || key2 === "room")) {
						const err16 = {
							instancePath,
							schemaPath: "#/oneOf/2/additionalProperties",
							keyword: "additionalProperties",
							params: { additionalProperty: key2 },
							message: "must NOT have additional properties"
						};
						if (vErrors === null) vErrors = [err16];
						else vErrors.push(err16);
						errors++;
						break;
					}
					if (_errs21 === errors) {
						if (data.kind !== void 0) {
							let data6 = data.kind;
							const _errs22 = errors;
							if (typeof data6 !== "string") {
								const err17 = {
									instancePath: instancePath + "/kind",
									schemaPath: "#/oneOf/2/properties/kind/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err17];
								else vErrors.push(err17);
								errors++;
							}
							if ("room_changed" !== data6) {
								const err18 = {
									instancePath: instancePath + "/kind",
									schemaPath: "#/oneOf/2/properties/kind/const",
									keyword: "const",
									params: { allowedValue: "room_changed" },
									message: "must be equal to constant"
								};
								if (vErrors === null) vErrors = [err18];
								else vErrors.push(err18);
								errors++;
							}
							var valid4 = _errs22 === errors;
						} else var valid4 = true;
						if (valid4) {
							if (data.room !== void 0) {
								const _errs24 = errors;
								if (!validate86(data.room, {
									instancePath: instancePath + "/room",
									parentData: data,
									parentDataProperty: "room",
									rootData,
									dynamicAnchors
								})) {
									vErrors = vErrors === null ? validate86.errors : vErrors.concat(validate86.errors);
									errors = vErrors.length;
								}
								var valid4 = _errs24 === errors;
							} else var valid4 = true;
						}
					}
				}
			} else {
				const err19 = {
					instancePath,
					schemaPath: "#/oneOf/2/type",
					keyword: "type",
					params: { type: "object" },
					message: "must be object"
				};
				if (vErrors === null) vErrors = [err19];
				else vErrors.push(err19);
				errors++;
			}
		}
		var _valid0 = _errs19 === errors;
		if (_valid0 && valid0) {
			valid0 = false;
			passing0 = [passing0, 2];
		} else {
			if (_valid0) {
				valid0 = true;
				passing0 = 2;
				if (props0 !== true) props0 = true;
			}
			const _errs25 = errors;
			if (errors === _errs25) {
				if (data && typeof data == "object" && !Array.isArray(data)) {
					let missing3;
					if (data.kind === void 0 && (missing3 = "kind") || data.participant === void 0 && (missing3 = "participant")) {
						const err20 = {
							instancePath,
							schemaPath: "#/oneOf/3/required",
							keyword: "required",
							params: { missingProperty: missing3 },
							message: "must have required property '" + missing3 + "'"
						};
						if (vErrors === null) vErrors = [err20];
						else vErrors.push(err20);
						errors++;
					} else {
						const _errs27 = errors;
						for (const key3 in data) if (!(key3 === "kind" || key3 === "participant")) {
							const err21 = {
								instancePath,
								schemaPath: "#/oneOf/3/additionalProperties",
								keyword: "additionalProperties",
								params: { additionalProperty: key3 },
								message: "must NOT have additional properties"
							};
							if (vErrors === null) vErrors = [err21];
							else vErrors.push(err21);
							errors++;
							break;
						}
						if (_errs27 === errors) {
							if (data.kind !== void 0) {
								let data8 = data.kind;
								const _errs28 = errors;
								if (typeof data8 !== "string") {
									const err22 = {
										instancePath: instancePath + "/kind",
										schemaPath: "#/oneOf/3/properties/kind/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									};
									if (vErrors === null) vErrors = [err22];
									else vErrors.push(err22);
									errors++;
								}
								if ("participant_profile_changed" !== data8) {
									const err23 = {
										instancePath: instancePath + "/kind",
										schemaPath: "#/oneOf/3/properties/kind/const",
										keyword: "const",
										params: { allowedValue: "participant_profile_changed" },
										message: "must be equal to constant"
									};
									if (vErrors === null) vErrors = [err23];
									else vErrors.push(err23);
									errors++;
								}
								var valid5 = _errs28 === errors;
							} else var valid5 = true;
							if (valid5) {
								if (data.participant !== void 0) {
									const _errs30 = errors;
									if (!validate88(data.participant, {
										instancePath: instancePath + "/participant",
										parentData: data,
										parentDataProperty: "participant",
										rootData,
										dynamicAnchors
									})) {
										vErrors = vErrors === null ? validate88.errors : vErrors.concat(validate88.errors);
										errors = vErrors.length;
									}
									var valid5 = _errs30 === errors;
								} else var valid5 = true;
							}
						}
					}
				} else {
					const err24 = {
						instancePath,
						schemaPath: "#/oneOf/3/type",
						keyword: "type",
						params: { type: "object" },
						message: "must be object"
					};
					if (vErrors === null) vErrors = [err24];
					else vErrors.push(err24);
					errors++;
				}
			}
			var _valid0 = _errs25 === errors;
			if (_valid0 && valid0) {
				valid0 = false;
				passing0 = [passing0, 3];
			} else {
				if (_valid0) {
					valid0 = true;
					passing0 = 3;
					if (props0 !== true) props0 = true;
				}
				const _errs31 = errors;
				if (errors === _errs31) {
					if (data && typeof data == "object" && !Array.isArray(data)) {
						let missing4;
						if (data.kind === void 0 && (missing4 = "kind") || data.agent_id === void 0 && (missing4 = "agent_id") || data.revision === void 0 && (missing4 = "revision")) {
							const err25 = {
								instancePath,
								schemaPath: "#/oneOf/4/required",
								keyword: "required",
								params: { missingProperty: missing4 },
								message: "must have required property '" + missing4 + "'"
							};
							if (vErrors === null) vErrors = [err25];
							else vErrors.push(err25);
							errors++;
						} else {
							const _errs33 = errors;
							for (const key4 in data) if (!(key4 === "agent_id" || key4 === "kind" || key4 === "revision")) {
								const err26 = {
									instancePath,
									schemaPath: "#/oneOf/4/additionalProperties",
									keyword: "additionalProperties",
									params: { additionalProperty: key4 },
									message: "must NOT have additional properties"
								};
								if (vErrors === null) vErrors = [err26];
								else vErrors.push(err26);
								errors++;
								break;
							}
							if (_errs33 === errors) {
								if (data.agent_id !== void 0) {
									const _errs34 = errors;
									if (typeof data.agent_id !== "string") {
										const err27 = {
											instancePath: instancePath + "/agent_id",
											schemaPath: "#/oneOf/4/properties/agent_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err27];
										else vErrors.push(err27);
										errors++;
									}
									var valid6 = _errs34 === errors;
								} else var valid6 = true;
								if (valid6) {
									if (data.kind !== void 0) {
										let data11 = data.kind;
										const _errs36 = errors;
										if (typeof data11 !== "string") {
											const err28 = {
												instancePath: instancePath + "/kind",
												schemaPath: "#/oneOf/4/properties/kind/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											};
											if (vErrors === null) vErrors = [err28];
											else vErrors.push(err28);
											errors++;
										}
										if ("agent_configuration_changed" !== data11) {
											const err29 = {
												instancePath: instancePath + "/kind",
												schemaPath: "#/oneOf/4/properties/kind/const",
												keyword: "const",
												params: { allowedValue: "agent_configuration_changed" },
												message: "must be equal to constant"
											};
											if (vErrors === null) vErrors = [err29];
											else vErrors.push(err29);
											errors++;
										}
										var valid6 = _errs36 === errors;
									} else var valid6 = true;
									if (valid6) {
										if (data.revision !== void 0) {
											let data12 = data.revision;
											const _errs38 = errors;
											if (errors === errors) {
												if (typeof data12 === "string") {
													if (func2(data12) > 19) {
														const err30 = {
															instancePath: instancePath + "/revision",
															schemaPath: "#/$defs/DecimalString/maxLength",
															keyword: "maxLength",
															params: { limit: 19 },
															message: "must NOT have more than 19 characters"
														};
														if (vErrors === null) vErrors = [err30];
														else vErrors.push(err30);
														errors++;
													} else if (!pattern4.test(data12)) {
														const err31 = {
															instancePath: instancePath + "/revision",
															schemaPath: "#/$defs/DecimalString/pattern",
															keyword: "pattern",
															params: { pattern: "^(0|[1-9][0-9]*)$" },
															message: "must match pattern \"^(0|[1-9][0-9]*)$\""
														};
														if (vErrors === null) vErrors = [err31];
														else vErrors.push(err31);
														errors++;
													}
												} else {
													const err32 = {
														instancePath: instancePath + "/revision",
														schemaPath: "#/$defs/DecimalString/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													};
													if (vErrors === null) vErrors = [err32];
													else vErrors.push(err32);
													errors++;
												}
											}
											var valid6 = _errs38 === errors;
										} else var valid6 = true;
									}
								}
							}
						}
					} else {
						const err33 = {
							instancePath,
							schemaPath: "#/oneOf/4/type",
							keyword: "type",
							params: { type: "object" },
							message: "must be object"
						};
						if (vErrors === null) vErrors = [err33];
						else vErrors.push(err33);
						errors++;
					}
				}
				var _valid0 = _errs31 === errors;
				if (_valid0 && valid0) {
					valid0 = false;
					passing0 = [passing0, 4];
				} else {
					if (_valid0) {
						valid0 = true;
						passing0 = 4;
						if (props0 !== true) props0 = true;
					}
					const _errs41 = errors;
					if (errors === _errs41) {
						if (data && typeof data == "object" && !Array.isArray(data)) {
							let missing5;
							if (data.kind === void 0 && (missing5 = "kind") || data.revision === void 0 && (missing5 = "revision")) {
								const err34 = {
									instancePath,
									schemaPath: "#/oneOf/5/required",
									keyword: "required",
									params: { missingProperty: missing5 },
									message: "must have required property '" + missing5 + "'"
								};
								if (vErrors === null) vErrors = [err34];
								else vErrors.push(err34);
								errors++;
							} else {
								const _errs43 = errors;
								for (const key5 in data) if (!(key5 === "kind" || key5 === "revision")) {
									const err35 = {
										instancePath,
										schemaPath: "#/oneOf/5/additionalProperties",
										keyword: "additionalProperties",
										params: { additionalProperty: key5 },
										message: "must NOT have additional properties"
									};
									if (vErrors === null) vErrors = [err35];
									else vErrors.push(err35);
									errors++;
									break;
								}
								if (_errs43 === errors) {
									if (data.kind !== void 0) {
										let data13 = data.kind;
										const _errs44 = errors;
										if (typeof data13 !== "string") {
											const err36 = {
												instancePath: instancePath + "/kind",
												schemaPath: "#/oneOf/5/properties/kind/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											};
											if (vErrors === null) vErrors = [err36];
											else vErrors.push(err36);
											errors++;
										}
										if ("global_configuration_changed" !== data13) {
											const err37 = {
												instancePath: instancePath + "/kind",
												schemaPath: "#/oneOf/5/properties/kind/const",
												keyword: "const",
												params: { allowedValue: "global_configuration_changed" },
												message: "must be equal to constant"
											};
											if (vErrors === null) vErrors = [err37];
											else vErrors.push(err37);
											errors++;
										}
										var valid8 = _errs44 === errors;
									} else var valid8 = true;
									if (valid8) {
										if (data.revision !== void 0) {
											let data14 = data.revision;
											const _errs46 = errors;
											if (errors === errors) {
												if (typeof data14 === "string") {
													if (func2(data14) > 19) {
														const err38 = {
															instancePath: instancePath + "/revision",
															schemaPath: "#/$defs/DecimalString/maxLength",
															keyword: "maxLength",
															params: { limit: 19 },
															message: "must NOT have more than 19 characters"
														};
														if (vErrors === null) vErrors = [err38];
														else vErrors.push(err38);
														errors++;
													} else if (!pattern4.test(data14)) {
														const err39 = {
															instancePath: instancePath + "/revision",
															schemaPath: "#/$defs/DecimalString/pattern",
															keyword: "pattern",
															params: { pattern: "^(0|[1-9][0-9]*)$" },
															message: "must match pattern \"^(0|[1-9][0-9]*)$\""
														};
														if (vErrors === null) vErrors = [err39];
														else vErrors.push(err39);
														errors++;
													}
												} else {
													const err40 = {
														instancePath: instancePath + "/revision",
														schemaPath: "#/$defs/DecimalString/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													};
													if (vErrors === null) vErrors = [err40];
													else vErrors.push(err40);
													errors++;
												}
											}
											var valid8 = _errs46 === errors;
										} else var valid8 = true;
									}
								}
							}
						} else {
							const err41 = {
								instancePath,
								schemaPath: "#/oneOf/5/type",
								keyword: "type",
								params: { type: "object" },
								message: "must be object"
							};
							if (vErrors === null) vErrors = [err41];
							else vErrors.push(err41);
							errors++;
						}
					}
					var _valid0 = _errs41 === errors;
					if (_valid0 && valid0) {
						valid0 = false;
						passing0 = [passing0, 5];
					} else if (_valid0) {
						valid0 = true;
						passing0 = 5;
						if (props0 !== true) props0 = true;
					}
				}
			}
		}
	}
	if (!valid0) {
		const err42 = {
			instancePath,
			schemaPath: "#/oneOf",
			keyword: "oneOf",
			params: { passingSchemas: passing0 },
			message: "must match exactly one schema in oneOf"
		};
		if (vErrors === null) vErrors = [err42];
		else vErrors.push(err42);
		errors++;
		validate84.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate84.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate84.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
function validate83(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate83.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.event_seq === void 0 && (missing0 = "event_seq") || data.event_id === void 0 && (missing0 = "event_id") || data.occurred_at === void 0 && (missing0 = "occurred_at") || data.payload === void 0 && (missing0 = "payload")) {
				validate83.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "event_id" || key0 === "event_seq" || key0 === "occurred_at" || key0 === "payload" || key0 === "schema_version")) {
					validate83.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data_generation_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.data_generation_id !== "string") {
							validate83.errors = [{
								instancePath: instancePath + "/data_generation_id",
								schemaPath: "#/properties/data_generation_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.event_id !== void 0) {
							const _errs4 = errors;
							if (typeof data.event_id !== "string") {
								validate83.errors = [{
									instancePath: instancePath + "/event_id",
									schemaPath: "#/properties/event_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.event_seq !== void 0) {
								let data2 = data.event_seq;
								const _errs6 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func2(data2) > 19) {
											validate83.errors = [{
												instancePath: instancePath + "/event_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											}];
											return false;
										} else if (!pattern4.test(data2)) {
											validate83.errors = [{
												instancePath: instancePath + "/event_seq",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											}];
											return false;
										}
									} else {
										validate83.errors = [{
											instancePath: instancePath + "/event_seq",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.occurred_at !== void 0) {
									let data3 = data.occurred_at;
									const _errs9 = errors;
									if (!(typeof data3 == "number" && !(data3 % 1) && !isNaN(data3) && isFinite(data3))) {
										validate83.errors = [{
											instancePath: instancePath + "/occurred_at",
											schemaPath: "#/properties/occurred_at/type",
											keyword: "type",
											params: { type: "integer" },
											message: "must be integer"
										}];
										return false;
									}
									if (errors === _errs9) {
										if (typeof data3 == "number" && isFinite(data3)) {
											if (data3 > 9007199254740991 || isNaN(data3)) {
												validate83.errors = [{
													instancePath: instancePath + "/occurred_at",
													schemaPath: "#/properties/occurred_at/maximum",
													keyword: "maximum",
													params: {
														comparison: "<=",
														limit: 9007199254740991
													},
													message: "must be <= 9007199254740991"
												}];
												return false;
											} else if (data3 < -9007199254740991 || isNaN(data3)) {
												validate83.errors = [{
													instancePath: instancePath + "/occurred_at",
													schemaPath: "#/properties/occurred_at/minimum",
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
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.payload !== void 0) {
										const _errs11 = errors;
										if (!validate84(data.payload, {
											instancePath: instancePath + "/payload",
											parentData: data,
											parentDataProperty: "payload",
											rootData,
											dynamicAnchors
										})) {
											vErrors = vErrors === null ? validate84.errors : vErrors.concat(validate84.errors);
											errors = vErrors.length;
										}
										var valid0 = _errs11 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.schema_version !== void 0) {
											let data5 = data.schema_version;
											const _errs12 = errors;
											if (typeof data5 !== "string") {
												validate83.errors = [{
													instancePath: instancePath + "/schema_version",
													schemaPath: "#/$defs/SchemaVersion/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
											if (!(data5 === "0.3")) {
												validate83.errors = [{
													instancePath: instancePath + "/schema_version",
													schemaPath: "#/$defs/SchemaVersion/enum",
													keyword: "enum",
													params: { allowedValues: schema128.enum },
													message: "must be equal to one of the allowed values"
												}];
												return false;
											}
											var valid0 = _errs12 === errors;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate83.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate83.errors = vErrors;
	return errors === 0;
}
validate83.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate78(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate78.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.room === void 0 && (missing0 = "room") || data.local_user === void 0 && (missing0 = "local_user") || data.participants === void 0 && (missing0 = "participants") || data.appearance === void 0 && (missing0 = "appearance") || data.latest_message_seq === void 0 && (missing0 = "latest_message_seq") || data.latest_event_seq === void 0 && (missing0 = "latest_event_seq") || data.events === void 0 && (missing0 = "events") || data.requires_full_reload === void 0 && (missing0 = "requires_full_reload") || data.data_directory === void 0 && (missing0 = "data_directory") || data.data_usage === void 0 && (missing0 = "data_usage") || data.app_version === void 0 && (missing0 = "app_version") || data.development_tools_available === void 0 && (missing0 = "development_tools_available")) {
				validate78.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!func1.call(schema105.properties, key0)) {
					validate78.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.app_version !== void 0) {
						const _errs2 = errors;
						if (typeof data.app_version !== "string") {
							validate78.errors = [{
								instancePath: instancePath + "/app_version",
								schemaPath: "#/properties/app_version/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.appearance !== void 0) {
							const _errs4 = errors;
							if (!validate79(data.appearance, {
								instancePath: instancePath + "/appearance",
								parentData: data,
								parentDataProperty: "appearance",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate79.errors : vErrors.concat(validate79.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.data_directory !== void 0) {
								const _errs5 = errors;
								if (typeof data.data_directory !== "string") {
									validate78.errors = [{
										instancePath: instancePath + "/data_directory",
										schemaPath: "#/properties/data_directory/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = _errs5 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.data_generation_id !== void 0) {
									const _errs7 = errors;
									if (typeof data.data_generation_id !== "string") {
										validate78.errors = [{
											instancePath: instancePath + "/data_generation_id",
											schemaPath: "#/properties/data_generation_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = _errs7 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.data_usage !== void 0) {
										const _errs9 = errors;
										if (!validate81(data.data_usage, {
											instancePath: instancePath + "/data_usage",
											parentData: data,
											parentDataProperty: "data_usage",
											rootData,
											dynamicAnchors
										})) {
											vErrors = vErrors === null ? validate81.errors : vErrors.concat(validate81.errors);
											errors = vErrors.length;
										}
										var valid0 = _errs9 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.development_tools_available !== void 0) {
											const _errs10 = errors;
											if (typeof data.development_tools_available !== "boolean") {
												validate78.errors = [{
													instancePath: instancePath + "/development_tools_available",
													schemaPath: "#/properties/development_tools_available/type",
													keyword: "type",
													params: { type: "boolean" },
													message: "must be boolean"
												}];
												return false;
											}
											var valid0 = _errs10 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.events !== void 0) {
												let data6 = data.events;
												const _errs12 = errors;
												if (errors === _errs12) {
													if (Array.isArray(data6)) {
														const len0 = data6.length;
														for (let i0 = 0; i0 < len0; i0++) {
															const _errs14 = errors;
															if (!validate83(data6[i0], {
																instancePath: instancePath + "/events/" + i0,
																parentData: data6,
																parentDataProperty: i0,
																rootData,
																dynamicAnchors
															})) {
																vErrors = vErrors === null ? validate83.errors : vErrors.concat(validate83.errors);
																errors = vErrors.length;
															}
															if (!(_errs14 === errors)) break;
														}
													} else {
														validate78.errors = [{
															instancePath: instancePath + "/events",
															schemaPath: "#/properties/events/type",
															keyword: "type",
															params: { type: "array" },
															message: "must be array"
														}];
														return false;
													}
												}
												var valid0 = _errs12 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.latest_event_seq !== void 0) {
													let data8 = data.latest_event_seq;
													const _errs15 = errors;
													if (errors === errors) {
														if (typeof data8 === "string") {
															if (func2(data8) > 19) {
																validate78.errors = [{
																	instancePath: instancePath + "/latest_event_seq",
																	schemaPath: "#/$defs/DecimalString/maxLength",
																	keyword: "maxLength",
																	params: { limit: 19 },
																	message: "must NOT have more than 19 characters"
																}];
																return false;
															} else if (!pattern4.test(data8)) {
																validate78.errors = [{
																	instancePath: instancePath + "/latest_event_seq",
																	schemaPath: "#/$defs/DecimalString/pattern",
																	keyword: "pattern",
																	params: { pattern: "^(0|[1-9][0-9]*)$" },
																	message: "must match pattern \"^(0|[1-9][0-9]*)$\""
																}];
																return false;
															}
														} else {
															validate78.errors = [{
																instancePath: instancePath + "/latest_event_seq",
																schemaPath: "#/$defs/DecimalString/type",
																keyword: "type",
																params: { type: "string" },
																message: "must be string"
															}];
															return false;
														}
													}
													var valid0 = _errs15 === errors;
												} else var valid0 = true;
												if (valid0) {
													if (data.latest_message_seq !== void 0) {
														let data9 = data.latest_message_seq;
														const _errs18 = errors;
														if (errors === errors) {
															if (typeof data9 === "string") {
																if (func2(data9) > 19) {
																	validate78.errors = [{
																		instancePath: instancePath + "/latest_message_seq",
																		schemaPath: "#/$defs/DecimalString/maxLength",
																		keyword: "maxLength",
																		params: { limit: 19 },
																		message: "must NOT have more than 19 characters"
																	}];
																	return false;
																} else if (!pattern4.test(data9)) {
																	validate78.errors = [{
																		instancePath: instancePath + "/latest_message_seq",
																		schemaPath: "#/$defs/DecimalString/pattern",
																		keyword: "pattern",
																		params: { pattern: "^(0|[1-9][0-9]*)$" },
																		message: "must match pattern \"^(0|[1-9][0-9]*)$\""
																	}];
																	return false;
																}
															} else {
																validate78.errors = [{
																	instancePath: instancePath + "/latest_message_seq",
																	schemaPath: "#/$defs/DecimalString/type",
																	keyword: "type",
																	params: { type: "string" },
																	message: "must be string"
																}];
																return false;
															}
														}
														var valid0 = _errs18 === errors;
													} else var valid0 = true;
													if (valid0) {
														if (data.local_user !== void 0) {
															const _errs21 = errors;
															if (!validate88(data.local_user, {
																instancePath: instancePath + "/local_user",
																parentData: data,
																parentDataProperty: "local_user",
																rootData,
																dynamicAnchors
															})) {
																vErrors = vErrors === null ? validate88.errors : vErrors.concat(validate88.errors);
																errors = vErrors.length;
															}
															var valid0 = _errs21 === errors;
														} else var valid0 = true;
														if (valid0) {
															if (data.participants !== void 0) {
																let data11 = data.participants;
																const _errs22 = errors;
																if (errors === _errs22) {
																	if (Array.isArray(data11)) {
																		const len1 = data11.length;
																		for (let i1 = 0; i1 < len1; i1++) {
																			const _errs24 = errors;
																			if (!validate88(data11[i1], {
																				instancePath: instancePath + "/participants/" + i1,
																				parentData: data11,
																				parentDataProperty: i1,
																				rootData,
																				dynamicAnchors
																			})) {
																				vErrors = vErrors === null ? validate88.errors : vErrors.concat(validate88.errors);
																				errors = vErrors.length;
																			}
																			if (!(_errs24 === errors)) break;
																		}
																	} else {
																		validate78.errors = [{
																			instancePath: instancePath + "/participants",
																			schemaPath: "#/properties/participants/type",
																			keyword: "type",
																			params: { type: "array" },
																			message: "must be array"
																		}];
																		return false;
																	}
																}
																var valid0 = _errs22 === errors;
															} else var valid0 = true;
															if (valid0) {
																if (data.requires_full_reload !== void 0) {
																	const _errs25 = errors;
																	if (typeof data.requires_full_reload !== "boolean") {
																		validate78.errors = [{
																			instancePath: instancePath + "/requires_full_reload",
																			schemaPath: "#/properties/requires_full_reload/type",
																			keyword: "type",
																			params: { type: "boolean" },
																			message: "must be boolean"
																		}];
																		return false;
																	}
																	var valid0 = _errs25 === errors;
																} else var valid0 = true;
																if (valid0) {
																	if (data.room !== void 0) {
																		const _errs27 = errors;
																		if (!validate86(data.room, {
																			instancePath: instancePath + "/room",
																			parentData: data,
																			parentDataProperty: "room",
																			rootData,
																			dynamicAnchors
																		})) {
																			vErrors = vErrors === null ? validate86.errors : vErrors.concat(validate86.errors);
																			errors = vErrors.length;
																		}
																		var valid0 = _errs27 === errors;
																	} else var valid0 = true;
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate78.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate78.errors = vErrors;
	return errors === 0;
}
validate78.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate77(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate77.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate77.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data" || key0 === "schema_version")) {
					validate77.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data !== void 0) {
						const _errs2 = errors;
						if (!validate78(data.data, {
							instancePath: instancePath + "/data",
							parentData: data,
							parentDataProperty: "data",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate78.errors : vErrors.concat(validate78.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate77.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate77.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema128.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs3 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate77.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate77.errors = vErrors;
	return errors === 0;
}
validate77.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema133 = {
	"additionalProperties": false,
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"field_path": { "type": ["string", "null"] },
		"may_have_been_charged": { "type": "boolean" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"trace_id": { "type": "string" }
	},
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	],
	"type": "object"
};
var schema134 = {
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	],
	"type": "string"
};
var schema135 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate100(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate100.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate100.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "field_path" || key0 === "may_have_been_charged" || key0 === "message" || key0 === "retryability" || key0 === "trace_id")) {
				validate100.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate100.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate100.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema134.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.field_path !== void 0) {
					let data1 = data.field_path;
					if (typeof data1 !== "string" && data1 !== null) {
						validate100.errors = [{
							instancePath: instancePath + "/field_path",
							schemaPath: "#/properties/field_path/type",
							keyword: "type",
							params: { type: schema133.properties.field_path.type },
							message: "must be string,null"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.may_have_been_charged !== void 0) {
						if (typeof data.may_have_been_charged !== "boolean") {
							validate100.errors = [{
								instancePath: instancePath + "/may_have_been_charged",
								schemaPath: "#/properties/may_have_been_charged/type",
								keyword: "type",
								params: { type: "boolean" },
								message: "must be boolean"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.message !== void 0) {
							if (typeof data.message !== "string") {
								validate100.errors = [{
									instancePath: instancePath + "/message",
									schemaPath: "#/properties/message/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.retryability !== void 0) {
								let data4 = data.retryability;
								if (typeof data4 !== "string") {
									validate100.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
									validate100.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/enum",
										keyword: "enum",
										params: { allowedValues: schema135.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.trace_id !== void 0) {
									if (typeof data.trace_id !== "string") {
										validate100.errors = [{
											instancePath: instancePath + "/trace_id",
											schemaPath: "#/properties/trace_id/type",
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
		validate100.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate100.errors = vErrors;
	return true;
}
validate100.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate99(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate99.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate99.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "error" || key0 === "schema_version")) {
					validate99.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.error !== void 0) {
						const _errs2 = errors;
						if (!validate100(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate100.errors : vErrors.concat(validate100.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate99.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate99.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema128.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs3 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate99.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate99.errors = vErrors;
	return errors === 0;
}
validate99.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate76(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate76.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate77(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate77.errors : vErrors.concat(validate77.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate99(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate99.errors : vErrors.concat(validate99.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate76.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate76.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate76.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
export { validateAppSnapshotResponse };
