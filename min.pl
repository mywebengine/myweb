#!/usr/bin/perl -w

my $v = '0.9.2';
my $in = "./";

my %import;
my $index = "";

go("");

my $out = './myweb.min.js';

open(my $fh, ">$out") || die;
my @imports;
while (my ($url, $data) = each(%import)) {
	$data =~ s!\\!\\\\!g;
	$data =~ s/\r*\n/\\\\n/g;
	$data =~ s/'/\\'/g;
	push(@imports, sprintf('["%s", import(\'%s\')]', $url, $data));
}
print $fh '/*!
 * myweb v'.$v.'
 * (c) 2019-2021 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */
self.__p=new Set;self.__i=new Map(['.join(",\n", @imports).']);self.__imports=Promise.all(self.__i.values()).then(()=>Promise.all(self.__p)).then(()=>{for(const u of self.__i.keys()) URL.revokeObjectURL(u)})
'.$index;
close($fh);

#`npx uglifyjs --mangle $out -o $out.min` || die;

sub go {
	my ($dir) = @_;
	opendir(my $dh, "$in/$dir") || die;
	foreach my $f (readdir($dh)) {
		next if ($f eq '.' || $f eq '..' || $f eq 'examples');
		$f = "$dir/$f";
		my $ff = "$in/$f";
		$ff =~ s!/+!/!g;
		if (-d $ff) {
			if ($ff ne './cmd' && $ff ne './render') {
				next;
			}
print "dir => $f\n";
			go($f);
			next;
		}
		if ($f !~ /\.js$/ || $f eq '/myweb.min.js') {
			next;
		}
print "file => $f\n";
		my $cnt = `npx uglifyjs --mangle -- $ff`;
		chomp($cnt);
		my $top = $f;
		if ($top =~ /\//) {
			$top =~ s!(.*/).+!$1!;
		} else {
			$top = '';
		}
		my @p;
		my @d;
		my @n;
		while ($cnt =~ s/import\s*([`'"])(.+?)\1(;|\r*\n|$)//) {
			my $url = normalize_url($2, $top);
			push(@p, sprintf('self.__i.get("%s")', $url));
			push(@d, undef);
			push(@n, []);
		}
		while ($cnt =~ s/import\s*(.+?)\s*from\s*([`'"])(.+?)\2(;|\r*\n|$)//) {
			my ($name, $url, @names) = ($1, normalize_url($3, $top));
			if ($name =~ s/\{(.*?)\}//) {	
				@names = split(/\s*,\s*/, $1);
			}
			$name =~ s/(^\s+|\s+$)//g;
			push(@p, sprintf('self.__i.get("%s")', $url));
			push(@d, $name);
			push(@n, \@names);
		}
		if (@p) {
			my $dcnt = 'let m;';
			my @lets;
			for (my $i = 0; $i < @p; $i++) {
				my @v;
				if ($d[$i]) {
					push(@v, sprintf('%s=m.default;', $d[$i]));
					push(@lets, $d[$i]);
				}
				foreach my $p (@{$n[$i]}) {
					push(@v, sprintf('%s=m.%s;', $p, $p));#todo AS
					push(@lets, $p);
				}
				if (@v) {
					$dcnt .= sprintf('m=arr[%d];%s', $i, join('', @v));
				}
			}
			$dcnt = sprintf('let %s;self.__p.add(import.meta.__imports=Promise.all([%s]).then(arr=>{%s}));', join(',', @lets), join(',', @p), $dcnt);
			if ($f eq '/myweb.js') {
				$cnt = $dcnt.'self.__imports.then(()=>{delete self.__i;delete self.__p;delete self.__imports;setTimeout(()=>{'.$cnt.'}, 0)})';
			} else {
				$cnt = $dcnt.$cnt;
			}
		}
		if ($f eq '/myweb.js') {
			$index = $cnt;
			next;
		}
		$import{$f} = 'data:text/javascript;text,'.$cnt;
	}
}

sub normalize_url {
	my ($url, $top) = @_;
	if ($url !~ /^\//) {
		$url = $top.$url;
	}
	$url =~ s!(/\./|/+)!/!g;
	$url =~ s![^/]+/\.\./!!g;
	$url;
}
