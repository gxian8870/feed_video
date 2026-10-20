package feed

import (
	"reflect"
	"testing"
)

func TestParseUniqueVideoIDs(t *testing.T) {
	members := []string{"11", "2", "02", "invalid", "0", "11", "3"}
	want := []uint{11, 2, 3}

	if got := parseUniqueVideoIDs(members); !reflect.DeepEqual(got, want) {
		t.Fatalf("parseUniqueVideoIDs() = %v, want %v", got, want)
	}
}
